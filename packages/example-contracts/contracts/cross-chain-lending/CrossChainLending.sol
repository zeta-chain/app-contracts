// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@zetachain/protocol-contracts/contracts/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/interfaces/ZetaInterfaces.sol";
import "./OracleInterface.sol";
import "./CrossChainLendingStorage.sol";

// @todo: remove when is stable
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
        IERC20(asset).safeIncreaseAllowance(address(this), amount);
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

    function getBorrowId(address user, address collateralAsset) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(user, collateralAsset, currentChainId));
    }

    function _applyRisk(uint256 amount, address collateralAsset) internal view returns (uint256) {
        uint256 risk = _riskTable[collateralAsset];
        return (amount * risk) / _generalScale;
    }

    function collateralNeededForCoverDebt(uint256 usdDebt, address collateralAsset) internal view returns (uint256) {
        uint256 q = OracleInterface(_oracleAddress).tokenPerUsd(usdDebt, collateralAsset);
        return _applyRisk(q, collateralAsset);
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
        uint256 collateralChainId,
        uint256 zetaValueAndGas,
        uint256 crossChaindestinationGasLimit
    ) external {
        if (IERC20(debtAsset).balanceOf(address(this)) - _treasureLocked[debtAsset] < amount)
            revert NotEnoughLiquidity();

        uint256 usdDebt = OracleInterface(_oracleAddress).usdPerToken(amount, debtAsset);

        if (currentChainId == collateralChainId) {
            lockCollateral(usdDebt, collateralAsset, msg.sender);
            IERC20(debtAsset).safeTransferFrom(address(this), msg.sender, amount);
            emit Borrow(debtAsset, amount, collateralAsset, usdDebt);
            return;
        }

        _treasureLocked[debtAsset] += amount;

        if (zetaValueAndGas == 0 && crossChaindestinationGasLimit == 0) {
            zetaValueAndGas = _zetaValueAndGas;
            crossChaindestinationGasLimit = _crossChaindestinationGasLimit;
        } else {
            IERC20(_zetaToken).safeTransferFrom(msg.sender, address(this), zetaValueAndGas);
        }

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: collateralChainId,
                destinationAddress: interactorsByChainId[collateralChainId],
                destinationGasLimit: crossChaindestinationGasLimit,
                message: abi.encode(
                    ACTION_VALIDATE_COLLATERAL,
                    debtAsset,
                    amount,
                    usdDebt,
                    collateralAsset,
                    msg.sender,
                    crossChaindestinationGasLimit
                ),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function _debtRepayFee(uint256 amount) internal pure returns (uint256) {
        return (amount * _feePerScale) / _generalScale;
    }

    function _repayUsdDebt(
        uint256 usdDebt,
        address collateralAsset,
        address caller
    ) internal {
        uint256 collateralCanBePay = OracleInterface(_oracleAddress).tokenPerUsd(usdDebt, collateralAsset);
        uint256 collateralCanBeUnlock = _applyRisk(collateralCanBePay, collateralAsset);

        uint256 collateralLocked = _depositsLocked[caller][collateralAsset];

        if (collateralCanBeUnlock > collateralLocked) {
            collateralCanBeUnlock = collateralLocked;
        }

        _deposits[caller][collateralAsset] += (collateralCanBeUnlock);
        _depositsLocked[caller][collateralAsset] -= collateralCanBeUnlock;

        collateralLocked = _depositsLocked[caller][collateralAsset];
        uint256 usdLeftDebt = 0;
        if (collateralLocked > 0) {
            usdLeftDebt =
                (OracleInterface(_oracleAddress).usdPerToken(collateralLocked, collateralAsset) * _generalScale) /
                _riskTable[collateralAsset];
        }

        bytes32 borrowId = getBorrowId(caller, collateralAsset);

        _borrows[borrowId].usdDebt = usdLeftDebt;
        _borrows[borrowId].collateralAsset = collateralAsset;
        _borrows[borrowId].collateralAmount = collateralLocked;
    }

    function repay(
        address debtAsset,
        uint256 amount,
        address collateralAsset,
        uint256 collateralChainId,
        uint256 zetaValueAndGas,
        uint256 crossChaindestinationGasLimit
    ) external {
        uint256 fee = _debtRepayFee(amount);
        uint256 usdDebt = OracleInterface(_oracleAddress).usdPerToken(amount - fee, debtAsset);

        if (currentChainId == collateralChainId) {
            _repayUsdDebt(usdDebt, collateralAsset, msg.sender);
        }

        IERC20(debtAsset).safeTransferFrom(msg.sender, address(this), amount - fee);
        IERC20(debtAsset).safeTransferFrom(msg.sender, _feeWallet, fee);

        if (currentChainId == collateralChainId) {
            return;
        }

        if (zetaValueAndGas == 0 && crossChaindestinationGasLimit == 0) {
            zetaValueAndGas = _zetaValueAndGas;
            crossChaindestinationGasLimit = _crossChaindestinationGasLimit;
        } else {
            IERC20(_zetaToken).safeTransferFrom(msg.sender, address(this), zetaValueAndGas);
        }

        // crosschain validation
        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: collateralChainId,
                destinationAddress: interactorsByChainId[collateralChainId],
                destinationGasLimit: zetaValueAndGas,
                message: abi.encode(
                    ACTION_REPAY,
                    debtAsset,
                    amount,
                    usdDebt,
                    collateralAsset,
                    msg.sender,
                    crossChaindestinationGasLimit
                ),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    // dev: public view that check if a particular user can be liquidated
    // if debtToCover * oraclePrice(debtAsset) * (1 + _riskTable) < collateralAsset user balance then true
    function canBeLiquidated(address collateralAsset, address user) external view returns (bool) {
        bytes32 borrowId = getBorrowId(user, collateralAsset);
        uint256 usdDebt = _borrows[borrowId].usdDebt;
        uint256 collateralLeftLoked = _borrows[borrowId].collateralAmount;

        uint256 collateralCanBePay = OracleInterface(_oracleAddress).tokenPerUsd(usdDebt, collateralAsset);
        uint256 collateralCanBeUnlock = _applyRisk(collateralCanBePay, collateralAsset);

        return collateralLeftLoked < (collateralCanBeUnlock * _liquidationRatio) / _generalScale;
    }

    // dev: actual implementation of toBeLiquidated that execute the liquidation
    function liquidate(address collateralAsset, address user) external {
        bool canBeLiquidatedResult = this.canBeLiquidated(collateralAsset, user);
        if (!canBeLiquidatedResult) revert CantBeLiquidated();

        uint256 collateralLocked = _depositsLocked[user][collateralAsset];
        _depositsLocked[user][collateralAsset] = 0;
        bytes32 borrowId = getBorrowId(user, collateralAsset);

        _borrows[borrowId].usdDebt = 0;
        _borrows[borrowId].collateralAsset = collateralAsset;
        _borrows[borrowId].collateralAmount = 0;
        IERC20(collateralAsset).safeTransferFrom(
            address(this),
            msg.sender,
            (collateralLocked * _liquidationReward) / _generalScale
        );
        IERC20(collateralAsset).safeTransferFrom(
            address(this),
            _feeWallet,
            (collateralLocked * (_generalScale - _liquidationReward)) / _generalScale
        );
    }

    function onZetaMessageValidateCollateral(ZetaInterfaces.ZetaMessage calldata zetaMessage) internal {
        (
            ,
            address debtAsset,
            uint256 amount,
            uint256 usdDebt,
            address collateralAsset,
            address caller,
            uint256 crossChaindestinationGasLimit
        ) = abi.decode(zetaMessage.message, (bytes32, address, uint256, uint256, address, address, uint256));

        uint256 collateralLocked = lockCollateral(usdDebt, collateralAsset, caller);
        bytes32 borrowId = getBorrowId(caller, collateralAsset);

        _borrows[borrowId].usdDebt = usdDebt;
        _borrows[borrowId].collateralAsset = collateralAsset;
        _borrows[borrowId].collateralAmount = collateralLocked;

        // crosschain validation
        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: zetaMessage.sourceChainId,
                destinationAddress: interactorsByChainId[zetaMessage.sourceChainId],
                destinationGasLimit: crossChaindestinationGasLimit,
                message: abi.encode(
                    ACTION_COLLATERAL_VALIDATED,
                    debtAsset,
                    amount,
                    usdDebt,
                    collateralAsset,
                    caller,
                    crossChaindestinationGasLimit
                ),
                zetaValueAndGas: zetaMessage.zetaValue,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessageCollateralValidated(ZetaInterfaces.ZetaMessage calldata zetaMessage) internal {
        (, address debtAsset, uint256 amount, uint256 usdDebt, address collateralAsset, address caller, ) = abi.decode(
            zetaMessage.message,
            (bytes32, address, uint256, uint256, address, address, uint256)
        );

        _treasureLocked[debtAsset] -= amount;
        IERC20(debtAsset).safeIncreaseAllowance(address(this), amount);
        IERC20(debtAsset).safeTransferFrom(address(this), caller, amount);
        emit Borrow(debtAsset, amount, collateralAsset, usdDebt);
    }

    function onZetaMessageRepay(ZetaInterfaces.ZetaMessage calldata zetaMessage) internal {
        (, , , uint256 usdDebt, address collateralAsset, address caller, ) = abi.decode(
            zetaMessage.message,
            (bytes32, address, uint256, uint256, address, address, uint256)
        );

        _repayUsdDebt(usdDebt, collateralAsset, caller);
    }

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata zetaMessage)
        external
        override
        isValidMessageCall(zetaMessage)
    {
        (bytes32 messageType, , , , , , ) = abi.decode(
            zetaMessage.message,
            (bytes32, address, uint256, uint256, address, address, uint256)
        );

        /**
         * @dev Setting a message type is a useful pattern to distinguish between different messages.
         */
        if (messageType == ACTION_VALIDATE_COLLATERAL) {
            onZetaMessageValidateCollateral(zetaMessage);
            return;
        }

        if (messageType == ACTION_COLLATERAL_VALIDATED) {
            onZetaMessageCollateralValidated(zetaMessage);
            return;
        }

        if (messageType == ACTION_REPAY) {
            onZetaMessageRepay(zetaMessage);
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
    {
        (, address debtAsset, uint256 amount, , , , ) = abi.decode(
            zetaRevert.message,
            (bytes32, address, uint256, uint256, address, address, uint256)
        );
        _treasureLocked[debtAsset] -= amount;
    }

    function getUserBalances(address user, address token) external view returns (uint256, uint256) {
        return (_deposits[user][token], _depositsLocked[user][token]);
    }

    function withdrawZeta(uint256 amount) external onlyRole(ADMIN_ROLE) {
        IERC20(_zetaToken).safeIncreaseAllowance(address(this), amount);
        IERC20(_zetaToken).safeTransferFrom(address(this), msg.sender, amount);
    }
}
