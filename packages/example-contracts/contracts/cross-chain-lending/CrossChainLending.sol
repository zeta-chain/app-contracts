// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@zetachain/protocol-contracts/contracts/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/interfaces/ZetaInterfaces.sol";
import "./OracleInterface.sol";
import "./CrossChainLendingStorage.sol";

interface CrossChainLendingPoolErrors {
    error NotEnoughBalance();

    error NotEnoughCollateral();

    error CantBeLiquidated();

    error InvalidAddress();

    error InvalidMessageType();
}

contract CrossChainLendingPool is ZetaInteractor, ZetaReceiver, CrossChainLendingStorage, CrossChainLendingPoolErrors {
    using SafeERC20 for IERC20;

    bytes32 public constant ACTION_VALIDATE_COLLATERAL = keccak256("ACTION_VALIDATE_COLLATERAL");
    bytes32 public constant ACTION_COLLATERAL_VALIDATED = keccak256("ACTION_COLLATERAL_VALIDATED");
    bytes32 public constant ACTION_REPAY = keccak256("ACTION_REPAY");

    IERC20 internal immutable _zetaToken;

    uint256 internal constant _feePerThousand = 10;

    event Borrow(address debtAsset, uint256 debtAmount, address collateralAsset, uint256 collateralAmount);

    constructor(address connectorAddress, address zetaTokenAddress) ZetaInteractor(connectorAddress) {
        _zetaToken = IERC20(zetaTokenAddress);
    }

    function setOracle(address oracleAddress) external {
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
        if (_deposits[msg.sender][asset] < amount) revert NotEnoughBalance();

        _deposits[msg.sender][asset] -= amount;
        IERC20(asset).safeTransferFrom(address(this), to, amount);
    }

    function collateralNeededForCoverDebt(
        address debtAsset,
        uint256 amount,
        address collateralAsset
    ) internal view returns (uint256) {
        uint256 q = OracleInterface(_oracleAddress).quote(debtAsset, amount, collateralAsset);
        uint256 risk = _riskTable[collateralAsset];
        return q * risk;
    }

    function lockCollateral(
        address debtAsset,
        uint256 amount,
        address collateralAsset,
        address caller
    ) internal returns (uint256) {
        uint256 collateralNeeded = collateralNeededForCoverDebt(debtAsset, amount, collateralAsset);
        uint256 collateralBalance = _deposits[caller][collateralAsset];
        // @todo validate collateralAmount > collateralBalance
        if (collateralNeeded > collateralBalance) revert NotEnoughCollateral();
        // if ok then lock it
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
        if (currentChainId == collateralChainId) {
            uint256 collateralNeeded = lockCollateral(debtAsset, amount, collateralAsset, msg.sender);
            IERC20(debtAsset).safeTransferFrom(address(this), msg.sender, amount);
            emit Borrow(debtAsset, amount, collateralAsset, collateralNeeded);
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
                message: abi.encode(ACTION_VALIDATE_COLLATERAL, debtAsset, amount, collateralAsset, msg.sender),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function calculateCollateralToRepay(
        address debtAsset,
        uint256 amount,
        address collateralAsset
    ) internal view returns (uint256) {
        uint256 q = OracleInterface(_oracleAddress).quote(debtAsset, amount, collateralAsset);
        return (q * (_feePerThousand + 1000)) / 1000;
    }

    function repay(
        address debtAsset,
        uint256 amount,
        address collateralAsset,
        uint256 collateralChainId
    ) external {
        if (currentChainId == collateralChainId) {
            uint256 collateralCanBePay = calculateCollateralToRepay(debtAsset, amount, collateralAsset);
            uint256 collateralToPay = _depositsLocked[msg.sender][collateralAsset];

            if (collateralCanBePay > collateralToPay) {
                collateralCanBePay = collateralToPay;
                // @todo: check to only transfer the needed amount? don't think so...
            }

            IERC20(debtAsset).safeTransferFrom(msg.sender, address(this), amount);

            _deposits[msg.sender][collateralAsset] += collateralCanBePay;
            _depositsLocked[msg.sender][collateralAsset] -= collateralCanBePay;
            return;
        }

        ///@todo: transfer and validate or validate and transfer? mmm...
        IERC20(debtAsset).safeTransferFrom(msg.sender, address(this), amount);
        // crosschain validation
        /// @todo: for this version we topup zeta to pay gas from the contract
        uint256 zetaValueAndGas = 2500000;
        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: collateralChainId,
                destinationAddress: interactorsByChainId[collateralChainId],
                destinationGasLimit: zetaValueAndGas,
                message: abi.encode(ACTION_REPAY, debtAsset, amount, collateralAsset, msg.sender),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    /// dev: public view that check if a particular user can be liquidated
    // if debtToCover * oraclePrice(debtAsset) * (1 + _riskTable) < collateralAsset user balance then true
    function toBeliquidated(
        address collateralAsset,
        address debtAsset,
        address user,
        uint256 debtToCover
    ) external view returns (bool) {
        uint256 collateralNeeded = collateralNeededForCoverDebt(debtAsset, debtToCover, collateralAsset);
        uint256 collateralLocked = _depositsLocked[user][collateralAsset];

        return collateralNeeded > collateralLocked;
    }

    /// dev: actual implementation of toBeLiquidated that execute the liquidation
    function liquidationCall(
        address collateralAsset,
        address debtAsset,
        address user,
        uint256 debtToCover
    ) external {
        bool canBeLiquidated = this.toBeliquidated(collateralAsset, debtAsset, user, debtToCover);
        if (!canBeLiquidated) revert CantBeLiquidated();

        uint256 collateralLocked = _depositsLocked[user][collateralAsset];
        _depositsLocked[user][collateralAsset] = 0;
        // @todo: all for the caller or a % per zeta??
        IERC20(collateralAsset).safeTransferFrom(address(this), msg.sender, collateralLocked);
    }

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata zetaMessage)
        external
        override
        isValidMessageCall(zetaMessage)
    {
        /**
         * @dev Decode should follow the signature of the message provided to zeta.send.
         */
        (bytes32 messageType, address debtAsset, uint256 amount, address collateralAsset, address caller) = abi.decode(
            zetaMessage.message,
            (bytes32, address, uint256, address, address)
        );

        /**
         * @dev Setting a message type is a useful pattern to distinguish between different messages.
         */
        if (messageType == ACTION_VALIDATE_COLLATERAL) {
            lockCollateral(debtAsset, amount, collateralAsset, msg.sender);

            // crosschain validation
            uint256 zetaValueAndGas = 2500000;
            connector.send(
                ZetaInterfaces.SendInput({
                    destinationChainId: zetaMessage.sourceChainId,
                    destinationAddress: interactorsByChainId[zetaMessage.sourceChainId],
                    destinationGasLimit: zetaValueAndGas,
                    message: abi.encode(ACTION_COLLATERAL_VALIDATED, debtAsset, amount, collateralAsset, caller),
                    zetaValueAndGas: zetaValueAndGas,
                    zetaParams: abi.encode("")
                })
            );
            return;
        }

        if (messageType == ACTION_COLLATERAL_VALIDATED) {
            uint256 collateralNeeded = collateralNeededForCoverDebt(debtAsset, amount, collateralAsset);

            IERC20(debtAsset).safeTransferFrom(address(this), caller, amount);

            emit Borrow(debtAsset, amount, collateralAsset, collateralNeeded);
            return;
        }

        if (messageType == ACTION_REPAY) {
            uint256 collateralCanBePay = calculateCollateralToRepay(debtAsset, amount, collateralAsset);
            uint256 collateralToPay = _depositsLocked[caller][collateralAsset];
            if (collateralCanBePay > collateralToPay) {
                collateralCanBePay = collateralToPay;
                // @todo: check to only transfer the needed amount, it's more complicated if comes from other chain...
            }

            _deposits[caller][collateralAsset] += collateralCanBePay;
            _depositsLocked[caller][collateralAsset] -= collateralCanBePay;
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
}
