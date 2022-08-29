// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@zetachain/protocol-contracts/contracts/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/interfaces/ZetaInterfaces.sol";
import "./OracleInterface.sol";
import "./CrossChainLendingStorage.sol";

/// @todo: remove when is stable
import "hardhat/console.sol";

interface CrossChainLendingErrors {
    error NotEnoughBalance();

    error NotEnoughCollateral();

    error NotEnoughLiquidity();

    error CantBeLiquidated();

    error InvalidAddress();

    error InvalidMessageType();
}

contract CrossChainLending is ZetaInteractor, ZetaReceiver, CrossChainLendingStorage, CrossChainLendingErrors {
    using SafeERC20 for IERC20;

    bytes32 public constant ACTION_VALIDATE_COLLATERAL = keccak256("ACTION_VALIDATE_COLLATERAL");
    bytes32 public constant ACTION_COLLATERAL_VALIDATED = keccak256("ACTION_COLLATERAL_VALIDATED");
    bytes32 public constant ACTION_REPAY = keccak256("ACTION_REPAY");

    IERC20 internal immutable _zetaToken;

    event Borrow(address debtAsset, uint256 debtAmount, address collateralAsset, uint256 collateralAmount);

    constructor(address connectorAddress, address zetaTokenAddress) ZetaInteractor(connectorAddress) {
        _zetaToken = IERC20(zetaTokenAddress);
        IERC20(zetaTokenAddress).approve(connectorAddress, 2**256 - 1);
    }

    function setOracle(address oracleAddress) external onlyRole(ADMIN_ROLE) {
        if (oracleAddress == address(0)) revert InvalidAddress();
        _oracleAddress = oracleAddress;
    }

    // dev: all the deposits are in the current chain
    function deposit(address asset, uint256 amount) external {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        _deposits[msg.sender][asset] = amount;
    }

    // dev: all the withdrawals are in the current chain
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external {
        // @todo: check if there's balance in the contract, maybe was borrow to someone
        if (_deposits[msg.sender][asset] < amount) revert NotEnoughBalance();

        _deposits[msg.sender][asset] -= amount;
        IERC20(asset).safeTransferFrom(address(this), to, amount);
    }

    function collateralNeededForCoverDebt(uint256 usdDebt, address collateralAsset) internal view returns (uint256) {
        uint256 q = OracleInterface(_oracleAddress).tokenPerUsd(usdDebt, collateralAsset);
        uint256 risk = _riskTable[collateralAsset];
        return q * risk;
    }

    function lockCollateral(
        uint256 usdDebt,
        address collateralAsset,
        address caller
    ) internal returns (uint256) {
        uint256 collateralNeeded = collateralNeededForCoverDebt(usdDebt, collateralAsset);
        uint256 collateralBalance = _deposits[caller][collateralAsset];

        if (collateralNeeded > collateralBalance) revert NotEnoughCollateral();

        _deposits[caller][collateralAsset] -= collateralNeeded;
        _depositsLocked[caller][collateralAsset] += collateralNeeded;
        return collateralNeeded;
    }

    /// dev: if collateralChainId == current chainId => check if the pool has the needed deposit for the current user
    /// dev: if collateralChainId != current chainId => make a crosschain call to validate collateral
    function borrow(
        address debtAsset,
        uint256 amount,
        address collateralAsset,
        uint256 collateralChainId
    ) external {
        if (IERC20(debtAsset).balanceOf(address(this)) < amount) revert NotEnoughLiquidity();
        uint256 usdDebt = OracleInterface(_oracleAddress).usdPerToken(amount, debtAsset);

        if (currentChainId == collateralChainId) {
            lockCollateral(usdDebt, collateralAsset, msg.sender);
            IERC20(debtAsset).safeTransferFrom(address(this), msg.sender, amount);
            emit Borrow(debtAsset, amount, collateralAsset, usdDebt);
            return;
        }

        // crosschain validation
        /// @todo: for this version we topup zeta to pay gas from the contract
        uint256 zetaValueAndGas = 2500000;

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: collateralChainId,
                destinationAddress: interactorsByChainId[collateralChainId],
                destinationGasLimit: zetaValueAndGas,
                message: abi.encode(
                    ACTION_VALIDATE_COLLATERAL,
                    debtAsset,
                    amount,
                    usdDebt,
                    collateralAsset,
                    msg.sender
                ),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function debtRepayFee(uint256 amount) internal pure returns (uint256) {
        return (amount * _feePerThousand) / 1000;
    }

    function repayUsdDebt(
        uint256 usdDebt,
        address collateralAsset,
        address caller
    ) internal {
        // @todo: should take fee only from the repay, no repay * risk
        uint256 collateralCanBePay = OracleInterface(_oracleAddress).tokenPerUsd(usdDebt, collateralAsset);
        uint256 collateralCanBeUnlock = collateralCanBePay * _riskTable[collateralAsset];

        uint256 collateralLocked = _depositsLocked[caller][collateralAsset];

        if (collateralCanBeUnlock > collateralLocked) {
            collateralCanBeUnlock = collateralLocked;
        }

        uint256 repayFee = debtRepayFee(collateralCanBeUnlock);

        IERC20(collateralAsset).safeApprove(address(this), repayFee);
        IERC20(collateralAsset).safeTransferFrom(address(this), _feeWallet, repayFee);

        _deposits[caller][collateralAsset] += (collateralCanBeUnlock - repayFee);
        _depositsLocked[caller][collateralAsset] -= collateralCanBeUnlock;
    }

    function repay(
        address debtAsset,
        uint256 amount,
        address collateralAsset,
        uint256 collateralChainId
    ) external {
        uint256 usdDebt = OracleInterface(_oracleAddress).usdPerToken(amount, debtAsset);

        if (currentChainId == collateralChainId) {
            repayUsdDebt(usdDebt, collateralAsset, msg.sender);
        }

        IERC20(debtAsset).safeTransferFrom(msg.sender, address(this), amount);

        if (currentChainId == collateralChainId) {
            return;
        }

        // crosschain validation
        /// @todo: for this version we topup zeta to pay gas from the contract
        uint256 zetaValueAndGas = 2500000;
        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: collateralChainId,
                destinationAddress: interactorsByChainId[collateralChainId],
                destinationGasLimit: zetaValueAndGas,
                message: abi.encode(ACTION_REPAY, debtAsset, amount, usdDebt, collateralAsset, msg.sender),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    /// dev: public view that check if a particular user can be liquidated
    // if debtToCover * oraclePrice(debtAsset) * (1 + _riskTable) < collateralAsset user balance then true
    // function toBeliquidated(
    //     address collateralAsset,
    //     address debtAsset,
    //     address user,
    //     uint256 debtToCover
    // ) external view returns (bool) {
    //     uint256 usdDebt = OracleInterface(_oracleAddress).usdPerToken(debtToCover, debtAsset);
    //     uint256 collateralNeeded = collateralNeededForCoverDebt(usdDebt, collateralAsset);
    //     uint256 collateralLocked = _depositsLocked[user][collateralAsset];

    //     return collateralNeeded > collateralLocked;
    // }

    // /// dev: actual implementation of toBeLiquidated that execute the liquidation
    // function liquidationCall(
    //     address collateralAsset,
    //     address debtAsset,
    //     address user,
    //     uint256 debtToCover
    // ) external {
    //     bool canBeLiquidated = this.toBeliquidated(collateralAsset, debtAsset, user, debtToCover);
    //     if (!canBeLiquidated) revert CantBeLiquidated();

    //     uint256 collateralLocked = _depositsLocked[user][collateralAsset];
    //     _depositsLocked[user][collateralAsset] = 0;
    //     // @todo: all for the caller or a % per zeta??
    //     IERC20(collateralAsset).safeTransferFrom(address(this), msg.sender, collateralLocked);
    // }

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata zetaMessage)
        external
        override
        isValidMessageCall(zetaMessage)
    {
        /**
         * @dev Decode should follow the signature of the message provided to zeta.send.
         */
        (
            bytes32 messageType,
            address debtAsset,
            uint256 amount,
            uint256 usdDebt,
            address collateralAsset,
            address caller
        ) = abi.decode(zetaMessage.message, (bytes32, address, uint256, uint256, address, address));

        /**
         * @dev Setting a message type is a useful pattern to distinguish between different messages.
         */
        if (messageType == ACTION_VALIDATE_COLLATERAL) {
            lockCollateral(usdDebt, collateralAsset, caller);

            // crosschain validation
            uint256 zetaValueAndGas = 2500000;
            connector.send(
                ZetaInterfaces.SendInput({
                    destinationChainId: zetaMessage.sourceChainId,
                    destinationAddress: interactorsByChainId[zetaMessage.sourceChainId],
                    destinationGasLimit: zetaValueAndGas,
                    message: abi.encode(
                        ACTION_COLLATERAL_VALIDATED,
                        debtAsset,
                        amount,
                        usdDebt,
                        collateralAsset,
                        caller
                    ),
                    zetaValueAndGas: zetaValueAndGas,
                    zetaParams: abi.encode("")
                })
            );
            return;
        }

        if (messageType == ACTION_COLLATERAL_VALIDATED) {
            IERC20(debtAsset).safeApprove(address(this), amount);
            IERC20(debtAsset).safeTransferFrom(address(this), caller, amount);
            emit Borrow(debtAsset, amount, collateralAsset, usdDebt);
            return;
        }

        if (messageType == ACTION_REPAY) {
            repayUsdDebt(usdDebt, collateralAsset, caller);
            return;
        }

        revert InvalidMessageType();
    }

    /**
     * @dev Called by the Zeta Connector contract when the message fails to be sent.
     * Useful to cleanup and leave the application on its initial state.
     * Note that the require statements and the functionality are similar to onZetaMessage.
     */
    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata zetaRevert)
        external
        override
        isValidRevertCall(zetaRevert)
    {}

    function getUserStatus(address user, address token) external view returns (uint256, uint256) {
        return (_deposits[user][token], _depositsLocked[user][token]);
    }
}
