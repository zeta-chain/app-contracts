// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

import "./interfaces/ZetaInterfaces.sol";

interface ZetaTokenConsumerUniV3Errors {
    error ErrorSwappingTokens();
}

/**
 * @dev Uniswap V3 strategy for ZetaTokenConsumer
 */
contract ZetaTokenConsumerUniV3 is ZetaTokenConsumer, ZetaTokenConsumerUniV3Errors {
    ISwapRouter swapRouter;

    function getZetaFromEth(uint256 minAmountOut) external payable override {
        // ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
        //     tokenIn: DAI,
        //     tokenOut: WETH9,
        //     fee: poolFee,
        //     recipient: msg.sender,
        //     deadline: block.timestamp,
        //     amountIn: amountIn,
        //     amountOutMinimum: 0,
        //     sqrtPriceLimitX96: 0
        // });
        // amountOut = swapRouter.exactInputSingle(params);
    }

    function getZetaFromToken(
        uint256 minAmountOut,
        address inputToken,
        uint256 inputTokenAmount
    ) external override {
        //
    }

    function getEthFromZeta(uint256 minAmountOut) external payable override {
        //
    }

    function getTokenFromZeta(uint256 minAmountOut) external override {
        //
    }
}
