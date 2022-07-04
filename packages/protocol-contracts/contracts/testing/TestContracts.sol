// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

/**
 * @dev Contracts that need to be compiled for testing purposes
 */

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/UniswapV2Router02.sol";

interface IWETH9 {
    function deposit() external payable;
}
