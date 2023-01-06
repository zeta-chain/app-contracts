// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./ZRC721Commands.sol";
import "./ZRC721.sol";
import "./ZRC721CommandMint.sol";
import "./ZRC721CommandTransfer.sol";
import "./ZRC721CommandTransferChain.sol";

// @todo: remove when is stable
import "hardhat/console.sol";

interface ZRC721ReceiverErrors {
    error InvalidMessageType();
}

contract ZRC721Receiver is
    ZRC721,
    ZetaReceiver,
    ZRC721ReceiverErrors,
    ZRC721CommandMint,
    ZRC721CommandTransfer,
    ZRC721CommandTransferChain
{
    constructor(
        address connectorAddress,
        address zetaTokenAddress,
        uint256 zChainId,
        string memory name,
        string memory symbol
    ) ZRC721(connectorAddress, zetaTokenAddress, zChainId, name, symbol) {}

    function _mint(address to, uint256 tokenId) internal virtual override {
        ZRC721CommandMint.command();
    }

    function _transfer(address from, address to, uint256 tokenId) internal virtual override {
        ZRC721CommandTransfer.command();
    }

    function _transferChain(address from, address to, uint256 tokenId, uint256 chainId) internal virtual {
        ZRC721CommandTransferChain.command();
    }

    function onZetaMessage(
        ZetaInterfaces.ZetaMessage calldata zetaMessage
    ) external override isValidMessageCall(zetaMessage) {
        (bytes32 messageType, , , , , , , ) = abi.decode(
            zetaMessage.message,
            (bytes32, address, uint256, uint256, uint256, address, address, uint256)
        );

        /**
         * @dev Setting a message type is a useful pattern to distinguish between different messages.
         */
        if (messageType == ERC721Commands.ACTION_MINT_REQUEST) {
            ZRC721CommandMint.onZetaMessageRequest(zetaMessage);
            return;
        }

        if (messageType == ERC721Commands.ACTION_MINT_CONFIRM) {
            ZRC721CommandMint.onZetaMessageConfirm(zetaMessage);
            return;
        }

        if (messageType == ERC721Commands.ACTION_TRANSFER_REQUEST) {
            ZRC721CommandTransfer.onZetaMessageRequest(zetaMessage);
            return;
        }

        if (messageType == ERC721Commands.ACTION_TRANSFER_CONFIRM) {
            ZRC721CommandTransfer.onZetaMessageConfirm(zetaMessage);
            return;
        }

        if (messageType == ERC721Commands.ACTION_TRANSFER_CHAIN_REQUEST) {
            ZRC721CommandTransferChain.onZetaMessageRequest(zetaMessage);
            return;
        }

        if (messageType == ERC721Commands.ACTION_TRANSFER_CHAIN_CONFIRM) {
            ZRC721CommandTransferChain.onZetaMessageConfirm(zetaMessage);
            return;
        }

        revert InvalidMessageType();
    }

    /**
     * @dev Called by the Zeta Connector contract when the message fails to be sent.
     * Useful to cleanup and leave the application on its initial state.
     * Note that the require statements and the functionality are similar to onZetaMessage.
     */
    function onZetaRevert(
        ZetaInterfaces.ZetaRevert calldata zetaRevert
    ) external override isValidRevertCall(zetaRevert) {
        (bytes32 messageType, address from, address to, uint256 tokenId, , ) = abi.decode(
            zetaRevert.message,
            (bytes32, address, address, uint256, address, uint256)
        );

        if (messageType == ERC721Commands.ACTION_TRANSFER_REQUEST) {
            super._transfer(address(this), from, tokenId);
        }
        emit OmnichainTransferFail(from, to, tokenId, zetaRevert.sourceChainId);
    }
}
