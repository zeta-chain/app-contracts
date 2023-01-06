// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./ZRC721.sol";

contract ZRC721CommandTransfer is ERC721 {
    function command(address from, address to, uint256 tokenId) internal virtual override {
        IERC20(ERC721._zetaToken).safeTransferFrom(msg.sender, address(this), ERC721._zetaValueAndGas);

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: _zChainId,
                destinationAddress: interactorsByChainId[_zChainId],
                destinationGasLimit: _crossChaindestinationGasLimit,
                message: abi.encode(
                    ERC721Commands.ACTION_TRANSFER_REQUEST,
                    from,
                    to,
                    tokenId,
                    block.chainid,
                    msg.sender,
                    _crossChaindestinationGasLimit
                ),
                zetaValueAndGas: _zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessageRequest(ZetaInterfaces.ZetaMessage calldata zetaMessage) internal {
        (, address from, address to, uint256 tokenId, , address sender, uint256 crossChaindestinationGasLimit) = abi
            .decode(zetaMessage.message, (bytes32, address, address, uint256, uint256, address, uint256));

        super._transfer(from, to, tokenId);
        emit OmnichainTransfer(from, to, tokenId, zetaMessage.sourceChainId);

        // crosschain confirmation
        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: zetaMessage.sourceChainId,
                destinationAddress: interactorsByChainId[zetaMessage.sourceChainId],
                destinationGasLimit: _crossChaindestinationGasLimit,
                message: abi.encode(
                    ERC721Commands.ACTION_TRANSFER_CONFIRM,
                    from,
                    to,
                    tokenId,
                    block.chainid,
                    sender,
                    crossChaindestinationGasLimit
                ),
                zetaValueAndGas: _zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessageConfirm(ZetaInterfaces.ZetaMessage calldata zetaMessage) internal {
        (, address from, address to, uint256 tokenId, , , ) = abi.decode(
            zetaMessage.message,
            (bytes32, address, address, uint256, uint256, address, uint256)
        );

        super._transfer(from, to, tokenId);
        emit OmnichainTransfer(from, to, tokenId, zetaMessage.sourceChainId);
    }
}
