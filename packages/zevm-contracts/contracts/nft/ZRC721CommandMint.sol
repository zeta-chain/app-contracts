// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./ZRC721.sol";

contract ZRC721CommandMint is ERC721 {
    function command(address to, uint256 tokenId) internal virtual override {
        if (block.chainid == ERC721._zChainId) {
            super._mint(to, tokenId);
            ERC721._tokenChainId[tokenId] = ERC721._zChainId;
            emit ERC721.OmnichainTransfer(address(0), to, tokenId, ERC721._zChainId);
            return;
        }
        IERC20(ERC721._zetaToken).safeTransferFrom(msg.sender, address(this), ERC721._zetaValueAndGas);

        ERC721.connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: ERC721._zChainId,
                destinationAddress: ERC721.interactorsByChainId[ERC721._zChainId],
                destinationGasLimit: ERC721._crossChaindestinationGasLimit,
                message: abi.encode(
                    ERC721Commands.ACTION_MINT_REQUEST,
                    to,
                    tokenId,
                    block.chainid,
                    msg.sender,
                    ERC721._crossChaindestinationGasLimit
                ),
                zetaValueAndGas: ERC721._zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessageRequest(ZetaInterfaces.ZetaMessage calldata zetaMessage) internal {
        (, , address to, uint256 tokenId, , address sender, uint256 crossChaindestinationGasLimit) = abi.decode(
            zetaMessage.message,
            (bytes32, address, address, uint256, uint256, address, uint256)
        );

        super._mint(to, tokenId);
        ERC721._tokenChainId[tokenId] = zetaMessage.sourceChainId;
        emit ERC721.OmnichainTransfer(address(0), to, tokenId, zetaMessage.sourceChainId);

        // crosschain confirmation
        ERC721.connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: zetaMessage.sourceChainId,
                destinationAddress: ERC721.interactorsByChainId[zetaMessage.sourceChainId],
                destinationGasLimit: ERC721._crossChaindestinationGasLimit,
                message: abi.encode(
                    ERC721Commands.ACTION_MINT_CONFIRM,
                    address(0),
                    to,
                    tokenId,
                    block.chainid,
                    sender,
                    crossChaindestinationGasLimit
                ),
                zetaValueAndGas: ERC721._zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessageConfirm(ZetaInterfaces.ZetaMessage calldata zetaMessage) internal {
        (, , address to, uint256 tokenId, , , ) = abi.decode(
            zetaMessage.message,
            (bytes32, address, address, uint256, uint256, address, uint256)
        );

        super._mint(to, tokenId);
        emit ERC721.OmnichainTransfer(address(0), to, tokenId, zetaMessage.sourceChainId);
    }
}
