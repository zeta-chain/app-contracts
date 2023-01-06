// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./ZRC721Receiver.sol";

contract MyFirstOmniNFT is ZRC721Receiver {
    constructor(
        address connectorAddress,
        address zetaTokenAddress,
        uint256 zChainId,
        string memory name,
        string memory symbol
    ) ZRC721Receiver(connectorAddress, zetaTokenAddress, zChainId, "MyFirstOmniNFT", "MFO") {}
}
