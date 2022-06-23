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
        address tssAddressUpdater_
    ) ZetaConnectorBase(zetaToken_, tssAddress_, tssAddressUpdater_) {}

    function getLockedAmount() external view returns (uint256) {
        return IERC20(zetaToken).balanceOf(address(this));
    }

    function send(ZetaInterfaces.SendInput calldata input) external override whenNotPaused {
        bool success = IERC20(zetaToken).transferFrom(msg.sender, address(this), input.zetaValueAndFees);
        if (!success) revert ZetaTransferError();

        emit ZetaSent(
            msg.sender,
            input.destinationChainId,
            input.destinationAddress,
            input.zetaValueAndFees,
            input.destinationGasLimit,
            input.message,
            input.zetaParams
        );
    }

    function onReceive(
        bytes calldata zetaTxSenderAddress,
        uint256 sourceChainId,
        address destinationAddress,
        uint256 zetaValueAndFees,
        bytes calldata message,
        bytes32 internalSendHash
    ) external override whenNotPaused onlyTssAddress {
        bool success = IERC20(zetaToken).transfer(destinationAddress, zetaValueAndFees);
        if (!success) revert ZetaTransferError();

        if (message.length > 0) {
            ZetaReceiver(destinationAddress).onZetaMessage(
                ZetaInterfaces.ZetaMessage(zetaTxSenderAddress, sourceChainId, destinationAddress, zetaValueAndFees, message)
            );
        }

        emit ZetaReceived(
            zetaTxSenderAddress,
            sourceChainId,
            destinationAddress,
            zetaValueAndFees,
            message,
            internalSendHash
        );
    }

    function onRevert(
        address zetaTxSenderAddress,
        uint256 sourceChainId,
        bytes calldata destinationAddress,
        uint256 destinationChainId,
        uint256 zetaValueAndFees,
        bytes calldata message,
        bytes32 internalSendHash
    ) external override whenNotPaused onlyTssAddress {
        bool success = IERC20(zetaToken).transfer(zetaTxSenderAddress, zetaValueAndFees);
        require(success, "ZetaConnector: error transferring Zeta");

        if (message.length > 0) {
            ZetaReceiver(zetaTxSenderAddress).onZetaRevert(
                ZetaInterfaces.ZetaRevert(
                    zetaTxSenderAddress,
                    sourceChainId,
                    destinationAddress,
                    destinationChainId,
                    zetaValueAndFees,
                    message
                )
            );
        }

        emit ZetaReverted(
            zetaTxSenderAddress,
            sourceChainId,
            destinationChainId,
            destinationAddress,
            zetaValueAndFees,
            message,
            internalSendHash
        );
    }
}
