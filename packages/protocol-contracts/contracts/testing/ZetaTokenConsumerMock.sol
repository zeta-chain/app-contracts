// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../interfaces/ZetaInterfaces.sol";

contract ZetaTokenConsumerMock {
    ZetaTokenConsumer zetaTokenConsumer;

    constructor(address strategyAddress) {
        zetaTokenConsumer = ZetaTokenConsumer(strategyAddress);
    }

    function setZetaTokenConsumerStrategyAddress(address strategyAddress) external {
        zetaTokenConsumer = ZetaTokenConsumer(strategyAddress);
    }

    function testgetZetaFromEth(uint256 minAmount) external payable {
        zetaTokenConsumer.getZetaFromEth(minAmount);
    }

    function testgetZetaFromToken(uint256 minAmount) external {
        zetaTokenConsumer.getZetaFromToken(minAmount);
    }

    function testgetEthFromZeta(uint256 minAmount) external payable {
        zetaTokenConsumer.getEthFromZeta(minAmount);
    }

    function testgetTokenFromZeta(uint256 minAmount) external {
        zetaTokenConsumer.getTokenFromZeta(minAmount);
    }
}
