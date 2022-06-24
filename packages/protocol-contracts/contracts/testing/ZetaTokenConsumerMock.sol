// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../interfaces/ZetaInterfaces.sol";

contract ZetaTokenConsumerMock {
    ZetaTokenConsumer zetaTokenConsumer;

    constructor(address strategyAddress) {
        zetaTokenConsumer = ZetaTokenConsumer(strategyAddress);
    }

    function setZetaTokenConsumerStrategy(address strategyAddress) external {
        zetaTokenConsumer = ZetaTokenConsumer(strategyAddress);
    }

    function testGetZetaFromEth(uint256 minAmountOut) external payable {
        zetaTokenConsumer.getZetaFromEth(minAmountOut);
    }

    function testGetZetaFromToken(
        uint256 minAmountOut,
        address inputToken,
        uint256 inputTokenAmount
    ) external {
        zetaTokenConsumer.getZetaFromToken(minAmountOut, inputToken, inputTokenAmount);
    }

    function testGetEthFromZeta(uint256 minAmountOut) external payable {
        zetaTokenConsumer.getEthFromZeta(minAmountOut);
    }

    function testGetTokenFromZeta(uint256 minAmountOut) external {
        zetaTokenConsumer.getTokenFromZeta(minAmountOut);
    }
}
