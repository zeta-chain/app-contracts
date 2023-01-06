// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./ZRC721.sol";

abstract contract ZRC721CommandTransferChain is ZRC721 {
    using SafeERC20 for IERC20;

    function command(address from, address to, uint256 tokenId, uint256 chainId) internal virtual {
        IERC20(_zetaToken).safeTransferFrom(msg.sender, address(this), _zetaValueAndGas);

        // this is to lock the NFT until we confirm the min on other chain
        super._transfer(from, address(this), tokenId);

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: _zChainId,
                destinationAddress: interactorsByChainId[_zChainId],
                destinationGasLimit: _crossChaindestinationGasLimit,
                message: abi.encode(
                    ERC721Commands.ACTION_TRANSFER_CHAIN_REQUEST,
                    from,
                    to,
                    tokenId,
                    chainId,
                    msg.sender,
                    _crossChaindestinationGasLimit
                ),
                zetaValueAndGas: _zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessageRequest(ZetaInterfaces.ZetaMessage calldata zetaMessage) internal virtual {
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
        _tokenChainId[tokenId] = chainId;
        emit OmnichainTransfer(from, to, tokenId, chainId);

        // crosschain confirmation
        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: zetaMessage.sourceChainId,
                destinationAddress: interactorsByChainId[zetaMessage.sourceChainId],
                destinationGasLimit: _crossChaindestinationGasLimit,
                message: abi.encode(
                    ERC721Commands.ACTION_TRANSFER_CHAIN_CONFIRM,
                    from,
                    to,
                    tokenId,
                    chainId,
                    sender,
                    crossChaindestinationGasLimit
                ),
                zetaValueAndGas: _zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );

        // crosschain confirmation
        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: chainId,
                destinationAddress: interactorsByChainId[chainId],
                destinationGasLimit: _crossChaindestinationGasLimit,
                message: abi.encode(
                    ERC721Commands.ACTION_MINT_CONFIRM,
                    from,
                    to,
                    tokenId,
                    chainId,
                    sender,
                    crossChaindestinationGasLimit
                ),
                zetaValueAndGas: _zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessageConfirm(ZetaInterfaces.ZetaMessage calldata zetaMessage) internal virtual {
        (, address from, address to, uint256 tokenId, , , ) = abi.decode(
            zetaMessage.message,
            (bytes32, address, address, uint256, uint256, address, uint256)
        );

        super._burn(tokenId);
        emit OmnichainTransfer(from, to, tokenId, zetaMessage.sourceChainId);
    }
}
