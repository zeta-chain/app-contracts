// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../CrossChainWarriors.sol";

contract CrossChainWarriorsMock is CrossChainWarriors {
    constructor(
        address connectorAddress,
        address zetaTokenAddress,
        address zetaConsumerAddress,
        bool useEven
    ) CrossChainWarriors(connectorAddress, zetaTokenAddress, zetaConsumerAddress, useEven) {}

    function mintId(address to, uint256 tokenId) external {
        return _mintId(to, tokenId);
    }
}
