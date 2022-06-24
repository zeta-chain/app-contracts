// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";

import "./interfaces/ZetaInterfaces.sol";

interface ZetaTokenConsumerUniV3Errors {
    error InputCantBeZero();

    error ErrorGettingToken();
}

/**
 * @dev Uniswap V3 strategy for ZetaTokenConsumer
 */
contract ZetaTokenConsumerUniV3 is ZetaTokenConsumer, ZetaTokenConsumerUniV3Errors {
    uint256 internal constant MAX_DEADLINE = 100;
    // @todo: check in doc if this fee is max, min or anything else
    uint24 public constant poolFee = 3000;

    address internal immutable wETH;
    address public zetaToken;

    ISwapRouter public immutable uniswapV3Router;
    IQuoter public immutable quoter;

    constructor(
        address zetaTokenInput_,
        address uniswapV3Router_,
        address quoter_,
        address wETH_
    ) {
        zetaToken = zetaTokenInput_;
        uniswapV3Router = ISwapRouter(uniswapV3Router_);
        quoter = IQuoter(quoter_);
        wETH = wETH_;
    }

    function getZetaFromEth(uint256 minAmountOut) external payable override {
        if (msg.value == 0) revert InputCantBeZero();

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            deadline: block.timestamp + MAX_DEADLINE,
            tokenIn: wETH,
            tokenOut: zetaToken,
            fee: poolFee,
            recipient: msg.sender,
            amountIn: msg.value,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0
        });

        uniswapV3Router.exactInputSingle{value: msg.value}(params);
    }

    function getZetaFromToken(
        uint256 minAmountOut,
        address inputToken,
        uint256 inputTokenAmount
    ) external override {
        if (inputTokenAmount == 0) revert InputCantBeZero();

        bool success = IERC20(inputToken).transferFrom(msg.sender, address(this), inputTokenAmount);

        success = IERC20(inputToken).approve(address(uniswapV3Router), inputTokenAmount);
        if (!success) revert ErrorGettingToken();

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            deadline: block.timestamp + MAX_DEADLINE,
            tokenIn: inputToken,
            tokenOut: zetaToken,
            fee: poolFee,
            recipient: msg.sender,
            amountIn: inputTokenAmount,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0
        });

        uniswapV3Router.exactInputSingle(params);
    }

    /// dev: it's the same as getTokenFromZeta(WETH) but we keep it in anothe function to avoid calling an external function from the contract
    function getEthFromZeta(uint256 minAmountOut, uint256 zetaTokenAmount) external override {
        if (zetaTokenAmount == 0) revert InputCantBeZero();

        bool success = IERC20(zetaToken).transferFrom(msg.sender, address(this), zetaTokenAmount);

        success = IERC20(zetaToken).approve(address(uniswapV3Router), zetaTokenAmount);
        if (!success) revert ErrorGettingToken();

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            deadline: block.timestamp + MAX_DEADLINE,
            tokenIn: zetaToken,
            tokenOut: wETH,
            fee: poolFee,
            recipient: msg.sender,
            amountIn: zetaTokenAmount,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0
        });

        uniswapV3Router.exactInputSingle(params);
    }

    function getTokenFromZeta(
        uint256 minAmountOut,
        address outputToken,
        uint256 zetaTokenAmount
    ) external override {
        if (zetaTokenAmount == 0) revert InputCantBeZero();

        bool success = IERC20(zetaToken).transferFrom(msg.sender, address(this), zetaTokenAmount);

        success = IERC20(zetaToken).approve(address(uniswapV3Router), zetaTokenAmount);
        if (!success) revert ErrorGettingToken();

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            deadline: block.timestamp + MAX_DEADLINE,
            tokenIn: zetaToken,
            tokenOut: outputToken,
            fee: poolFee,
            recipient: msg.sender,
            amountIn: zetaTokenAmount,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0
        });

        uniswapV3Router.exactInputSingle(params);
    }
}
