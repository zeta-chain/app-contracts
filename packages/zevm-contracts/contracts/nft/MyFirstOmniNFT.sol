// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./ZRC721.sol";

contract MyFirstOmniNFT is ZRC721 {
    constructor(
        address connectorAddress,
        address zetaTokenAddress,
        uint256 zChainId,
        string memory name,
        string memory symbol
    ) ZRC721(connectorAddress, zetaTokenAddress, zChainId, "MyFirstOmniNFT", "MFO") {}
}
