// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/ConnectorErrors.sol";
import "./ZetaConnector.base.sol";
import "./ZetaInterfaces.sol";

contract ZetaConnectorEth is ZetaConnectorBase {
    constructor(
        address zetaTokenAddress,
        address tssAddress,
        address tssAddressUpdater
    ) ZetaConnectorBase(zetaTokenAddress, tssAddress, tssAddressUpdater) {}

    function getLockedAmount() public view returns (uint256) {
        return IERC20(zetaToken).balanceOf(address(this));
    }

    function send(ZetaInterfaces.SendInput calldata input) external override whenNotPaused {
        bool success = IERC20(zetaToken).transferFrom(msg.sender, address(this), input.zetaAmount);
        if (!success) revert ZetaTransferError();

        emit ZetaSent(
            msg.sender,
            input.destinationChainId,
            input.destinationAddress,
            input.zetaAmount,
            input.gasLimit,
            input.message,
            input.zetaParams
        );
    }

    function onReceive(
        bytes calldata originSenderAddress,
        uint256 originChainId,
        address destinationAddress,
        uint256 zetaAmount,
        bytes calldata message,
        bytes32 internalSendHash
    ) external override whenNotPaused onlyTssAddress {
        bool success = IERC20(zetaToken).transfer(destinationAddress, zetaAmount);
        if (!success) revert ZetaTransferError();

        if (message.length > 0) {
            ZetaReceiver(destinationAddress).onZetaMessage(
                ZetaInterfaces.ZetaMessage(originSenderAddress, originChainId, destinationAddress, zetaAmount, message)
            );
        }

        emit ZetaReceived(
            originSenderAddress,
            originChainId,
            destinationAddress,
            zetaAmount,
            message,
            internalSendHash
        );
    }

    function onRevert(
        address originSenderAddress,
        uint256 originChainId,
        bytes calldata destinationAddress,
        uint256 destinationChainId,
        uint256 zetaAmount,
        bytes calldata message,
        bytes32 internalSendHash
    ) external override whenNotPaused onlyTssAddress {
        bool success = IERC20(zetaToken).transfer(originSenderAddress, zetaAmount);
        require(success == true, "ZetaConnector: error transferring Zeta");

        if (message.length > 0) {
            ZetaReceiver(originSenderAddress).onZetaRevert(
                ZetaInterfaces.ZetaRevert(
                    originSenderAddress,
                    originChainId,
                    destinationAddress,
                    destinationChainId,
                    zetaAmount,
                    message
                )
            );
        }

        emit ZetaReverted(
            originSenderAddress,
            originChainId,
            destinationChainId,
            destinationAddress,
            zetaAmount,
            message,
            internalSendHash
        );
    }
}
