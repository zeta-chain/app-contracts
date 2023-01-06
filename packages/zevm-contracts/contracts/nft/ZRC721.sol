// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "@zetachain/protocol-contracts/contracts/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/interfaces/ZetaInterfaces.sol";

import "./ZRC721Commands.sol";

// @todo: remove when is stable
import "hardhat/console.sol";

interface ZRC721Errors {
    error InvalidMessageType();
}

contract ZRC721 is ERC721, ZRC721Errors, ZetaInteractor {
    using SafeERC20 for IERC20;

    IERC20 internal immutable _zetaToken;
    uint256 internal immutable _zChainId;

    uint256 internal _zetaValueAndGas;
    uint256 internal _crossChaindestinationGasLimit;

    mapping(uint256 => uint256) private _tokenChainId;

    event OmnichainTransfer(address from, address to, uint256 tokenId, uint256 chainId);
    event OmnichainTransferFail(address from, address to, uint256 tokenId, uint256 chainId);

    constructor(
        address connectorAddress,
        address zetaTokenAddress,
        uint256 zChainId,
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) ZetaInteractor(connectorAddress) {
        _zetaToken = IERC20(zetaTokenAddress);
        _zChainId = zChainId;
        IERC20(zetaTokenAddress).approve(connectorAddress, 2 ** 256 - 1);
    }
}
