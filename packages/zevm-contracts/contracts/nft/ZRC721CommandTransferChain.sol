// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./ZRC721.sol";

contract ZRC721CommandTransferChain is ERC721 {
    function command(address from, address to, uint256 tokenId, uint256 chainId) internal virtual {
        IERC20(ERC721._zetaToken).safeTransferFrom(msg.sender, address(this), ERC721._zetaValueAndGas);

        // this is to lock the NFT until we confirm the min on other chain
        super._transfer(from, address(this), tokenId);

        ERC721.connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: ERC721._zChainId,
                destinationAddress: ERC721.interactorsByChainId[ERC721._zChainId],
                destinationGasLimit: ERC721._crossChaindestinationGasLimit,
                message: abi.encode(
                    ERC721Commands.ACTION_TRANSFER_CHAIN_REQUEST,
                    from,
                    to,
                    tokenId,
                    chainId,
                    msg.sender,
                    ERC721._crossChaindestinationGasLimit
                ),
                zetaValueAndGas: ERC721._zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessageRequest(ZetaInterfaces.ZetaMessage calldata zetaMessage) internal {
        (
            ,
            address from,
            address to,
            uint256 tokenId,
            uint256 chainId,
            address sender,
            uint256 crossChaindestinationGasLimit
        ) = abi.decode(zetaMessage.message, (bytes32, address, address, uint256, uint256, address, uint256));

        super._transfer(from, to, tokenId);
        ERC721._tokenChainId[tokenId] = chainId;
        emit ERC721.OmnichainTransfer(from, to, tokenId, chainId);

        // crosschain confirmation
        ERC721.connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: zetaMessage.sourceChainId,
                destinationAddress: ERC721.interactorsByChainId[zetaMessage.sourceChainId],
                destinationGasLimit: ERC721._crossChaindestinationGasLimit,
                message: abi.encode(
                    ERC721Commands.ACTION_TRANSFER_CHAIN_CONFIRM,
                    from,
                    to,
                    tokenId,
                    chainId,
                    sender,
                    crossChaindestinationGasLimit
                ),
                zetaValueAndGas: ERC721._zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );

        // crosschain confirmation
        ERC721.connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: chainId,
                destinationAddress: ERC721.interactorsByChainId[chainId],
                destinationGasLimit: ERC721._crossChaindestinationGasLimit,
                message: abi.encode(
                    ERC721Commands.ACTION_MINT_CONFIRM,
                    from,
                    to,
                    tokenId,
                    chainId,
                    sender,
                    crossChaindestinationGasLimit
                ),
                zetaValueAndGas: ERC721._zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessageConfirm(ZetaInterfaces.ZetaMessage calldata zetaMessage) internal {
        (, address from, address to, uint256 tokenId, , , ) = abi.decode(
            zetaMessage.message,
            (bytes32, address, address, uint256, uint256, address, uint256)
        );

        super._burn(tokenId);
        emit ERC721.OmnichainTransfer(from, to, tokenId, zetaMessage.sourceChainId);
    }
}
