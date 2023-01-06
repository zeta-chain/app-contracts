// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./ZRC721.sol";

abstract contract ZRC721CommandMint is ZRC721 {
    using SafeERC20 for IERC20;

    function command(address to, uint256 tokenId) internal virtual {
        if (block.chainid == _zChainId) {
            super._mint(to, tokenId);
            _tokenChainId[tokenId] = _zChainId;
            emit OmnichainTransfer(address(0), to, tokenId, _zChainId);
            return;
        }
        IERC20(_zetaToken).safeTransferFrom(msg.sender, address(this), _zetaValueAndGas);

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: _zChainId,
                destinationAddress: interactorsByChainId[_zChainId],
                destinationGasLimit: _crossChaindestinationGasLimit,
                message: abi.encode(
                    ERC721Commands.ACTION_MINT_REQUEST,
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

    function onZetaMessageRequest(ZetaInterfaces.ZetaMessage calldata zetaMessage) internal virtual {
        (, , address to, uint256 tokenId, , address sender, uint256 crossChaindestinationGasLimit) = abi.decode(
            zetaMessage.message,
            (bytes32, address, address, uint256, uint256, address, uint256)
        );

        super._mint(to, tokenId);
        _tokenChainId[tokenId] = zetaMessage.sourceChainId;
        emit OmnichainTransfer(address(0), to, tokenId, zetaMessage.sourceChainId);

        // crosschain confirmation
        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: zetaMessage.sourceChainId,
                destinationAddress: interactorsByChainId[zetaMessage.sourceChainId],
                destinationGasLimit: _crossChaindestinationGasLimit,
                message: abi.encode(
                    ERC721Commands.ACTION_MINT_CONFIRM,
                    address(0),
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

    function onZetaMessageConfirm(ZetaInterfaces.ZetaMessage calldata zetaMessage) internal virtual {
        (, , address to, uint256 tokenId, , , ) = abi.decode(
            zetaMessage.message,
            (bytes32, address, address, uint256, uint256, address, uint256)
        );

        super._mint(to, tokenId);
        emit OmnichainTransfer(address(0), to, tokenId, zetaMessage.sourceChainId);
    }
}
