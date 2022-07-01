// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/ConnectorErrors.sol";
import "./ZetaConnector.base.sol";
import "./interfaces/ZetaInterfaces.sol";

contract ZetaConnectorEth is ZetaConnectorBase {
    constructor(
        address zetaToken_,
        address tssAddress_,
        address tssAddressUpdater_,
        address pauserAddress_
    ) ZetaConnectorBase(zetaToken_, tssAddress_, tssAddressUpdater_, pauserAddress_) {}

    function getLockedAmount() external view returns (uint256) {
        return IERC20(zetaToken).balanceOf(address(this));
    }

    function send(ZetaInterfaces.SendInput calldata input) external override whenNotPaused {
        bool success = IERC20(zetaToken).transferFrom(msg.sender, address(this), input.zetaValueAndGas);
        if (!success) revert ZetaTransferError();

        emit ZetaSent(
            tx.origin,
            msg.sender,
            input.destinationChainId,
            input.destinationAddress,
            input.zetaValueAndGas,
            input.destinationGasLimit,
            input.message,
            input.zetaParams
        );
    }

    function onReceive(
        bytes calldata zetaTxSenderAddress,
        uint256 sourceChainId,
        address destinationAddress,
        uint256 zetaValueAndGas,
        bytes calldata message,
        bytes32 internalSendHash
    ) external override whenNotPaused onlyTssAddress {
        bool success = IERC20(zetaToken).transfer(destinationAddress, zetaValueAndGas);
        if (!success) revert ZetaTransferError();

        if (message.length > 0) {
            ZetaReceiver(destinationAddress).onZetaMessage(
                ZetaInterfaces.ZetaMessage(
                    zetaTxSenderAddress,
                    sourceChainId,
                    destinationAddress,
                    zetaValueAndGas,
                    message
                )
            );
        }

        emit ZetaReceived(
            zetaTxSenderAddress,
            sourceChainId,
            destinationAddress,
            zetaValueAndGas,
            message,
            internalSendHash
        );
    }

    function onRevert(
        address zetaTxSenderAddress,
        uint256 sourceChainId,
        bytes calldata destinationAddress,
        uint256 destinationChainId,
        uint256 zetaValueAndGas,
        bytes calldata message,
        bytes32 internalSendHash
    ) external override whenNotPaused onlyTssAddress {
        bool success = IERC20(zetaToken).transfer(zetaTxSenderAddress, zetaValueAndGas);
        if (!success) revert ZetaTransferError();

        if (message.length > 0) {
            ZetaReceiver(zetaTxSenderAddress).onZetaRevert(
                ZetaInterfaces.ZetaRevert(
                    zetaTxSenderAddress,
                    sourceChainId,
                    destinationAddress,
                    destinationChainId,
                    zetaValueAndGas,
                    message
                )
            );
        }

        emit ZetaReverted(
            zetaTxSenderAddress,
            sourceChainId,
            destinationChainId,
            destinationAddress,
            zetaValueAndGas,
            message,
            internalSendHash
        );
    }
}
