// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./ZetaConnector.base.sol";
import "./interfaces/ZetaInterfaces.sol";

interface ZetaToken is IERC20 {
    function burnFrom(address account, uint256 amount) external;

    function mint(
        address mintee,
        uint256 value,
        bytes32 internalSendHash
    ) external;
}

contract ZetaConnectorNonEth is ZetaConnectorBase {
    uint256 public maxSupply = 2**256 - 1;

    constructor(
        address zetaTokenAddress_,
        address tssAddress_,
        address tssAddressUpdater_
    ) ZetaConnectorBase(zetaTokenAddress_, tssAddress_, tssAddressUpdater_) {}

    function getLockedAmount() external view returns (uint256) {
        return ZetaToken(zetaToken).balanceOf(address(this));
    }

    function send(ZetaInterfaces.SendInput calldata input) external override whenNotPaused {
        ZetaToken(zetaToken).burnFrom(msg.sender, input.zetaAmount);

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
        if (zetaAmount + ZetaToken(zetaToken).totalSupply() > maxSupply) revert ExceedsMaxSupply(maxSupply);
        ZetaToken(zetaToken).mint(destinationAddress, zetaAmount, internalSendHash);

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
        if (zetaAmount + ZetaToken(zetaToken).totalSupply() > maxSupply) revert ExceedsMaxSupply(maxSupply);
        ZetaToken(zetaToken).mint(originSenderAddress, zetaAmount, internalSendHash);

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

    function setMaxSupply(uint256 maxSupply_) external onlyTssAddress {
        maxSupply = maxSupply_;
    }
}
