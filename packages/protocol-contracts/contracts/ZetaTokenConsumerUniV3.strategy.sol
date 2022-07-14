// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";

import "./interfaces/ZetaInterfaces.sol";

interface ZetaTokenConsumerUniV3Errors {
    error InvalidAddress();

    error InputCantBeZero();

    error ErrorGettingToken();

    error ErrorSendingETH();

    error ReentrancyError();
}

interface WETH9 {
    function withdraw(uint256 wad) external;
}

/**
 * @dev Uniswap V3 strategy for ZetaTokenConsumer
 */
contract ZetaTokenConsumerUniV3 is ZetaTokenConsumer, ZetaTokenConsumerUniV3Errors {
    uint256 internal constant MAX_DEADLINE = 200;

    uint24 public immutable zetaPoolFee;
    uint24 public immutable tokenPoolFee;

    address internal immutable WETH9Address;
    address public immutable zetaToken;

    ISwapRouter public immutable uniswapV3Router;
    IQuoter public immutable quoter;

    bool internal _locked;

    constructor(
        address zetaToken_,
        address uniswapV3Router_,
        address quoter_,
        address WETH9Address_,
        uint24 zetaPoolFee_,
        uint24 tokenPoolFee_
    ) {
        if (
            zetaToken_ == address(0) ||
            uniswapV3Router_ == address(0) ||
            quoter_ == address(0) ||
            WETH9Address_ == address(0)
        ) revert InvalidAddress();

        zetaToken = zetaToken_;
        uniswapV3Router = ISwapRouter(uniswapV3Router_);
        quoter = IQuoter(quoter_);
        WETH9Address = WETH9Address_;
        zetaPoolFee = zetaPoolFee_;
        tokenPoolFee = tokenPoolFee_;
    }

    modifier nonReentrant() {
        if (_locked) revert ReentrancyError();
        _locked = true;
        _;
        _locked = false;
    }

    receive() external payable {}

    function getZetaFromEth(address destinationAddress, uint256 minAmountOut)
        external
        payable
        override
        returns (uint256)
    {
        if (destinationAddress == address(0)) revert InvalidAddress();
        if (msg.value == 0) revert InputCantBeZero();

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            deadline: block.timestamp + MAX_DEADLINE,
            tokenIn: WETH9Address,
            tokenOut: zetaToken,
            fee: zetaPoolFee,
            recipient: destinationAddress,
            amountIn: msg.value,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = uniswapV3Router.exactInputSingle{value: msg.value}(params);

        emit EthExchangedForZeta(msg.value, amountOut);
        return amountOut;
    }

    function getZetaFromToken(
        address destinationAddress,
        uint256 minAmountOut,
        address inputToken,
        uint256 inputTokenAmount
    ) external override returns (uint256) {
        if (destinationAddress == address(0) || inputToken == address(0)) revert InvalidAddress();
        if (inputTokenAmount == 0) revert InputCantBeZero();

        bool success = IERC20(inputToken).transferFrom(msg.sender, address(this), inputTokenAmount);
        if (!success) revert ErrorGettingToken();
        success = IERC20(inputToken).approve(address(uniswapV3Router), inputTokenAmount);
        if (!success) revert ErrorGettingToken();

        ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
            deadline: block.timestamp + MAX_DEADLINE,
            path: abi.encodePacked(inputToken, tokenPoolFee, WETH9Address, zetaPoolFee, zetaToken),
            recipient: destinationAddress,
            amountIn: inputTokenAmount,
            amountOutMinimum: minAmountOut
        });

        uint256 amountOut = uniswapV3Router.exactInput(params);

        emit TokenExchangedForZeta(inputToken, inputTokenAmount, amountOut);
        return amountOut;
    }

    function getEthFromZeta(
        address destinationAddress,
        uint256 minAmountOut,
        uint256 zetaTokenAmount
    ) external override returns (uint256) {
        if (destinationAddress == address(0)) revert InvalidAddress();
        if (zetaTokenAmount == 0) revert InputCantBeZero();

        bool success = IERC20(zetaToken).transferFrom(msg.sender, address(this), zetaTokenAmount);
        if (!success) revert ErrorGettingToken();
        success = IERC20(zetaToken).approve(address(uniswapV3Router), zetaTokenAmount);
        if (!success) revert ErrorGettingToken();

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            deadline: block.timestamp + MAX_DEADLINE,
            tokenIn: zetaToken,
            tokenOut: WETH9Address,
            fee: zetaPoolFee,
            recipient: address(this),
            amountIn: zetaTokenAmount,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = uniswapV3Router.exactInputSingle(params);

        WETH9(WETH9Address).withdraw(amountOut);

        emit ZetaExchangedForEth(zetaTokenAmount, amountOut);

        (bool sent, ) = destinationAddress.call{value: amountOut}("");
        if (!sent) revert ErrorSendingETH();

        return amountOut;
    }

    function getTokenFromZeta(
        address destinationAddress,
        uint256 minAmountOut,
        address outputToken,
        uint256 zetaTokenAmount
    ) external override nonReentrant returns (uint256) {
        if (destinationAddress == address(0) || outputToken == address(0)) revert InvalidAddress();
        if (zetaTokenAmount == 0) revert InputCantBeZero();

        bool success = IERC20(zetaToken).transferFrom(msg.sender, address(this), zetaTokenAmount);
        if (!success) revert ErrorGettingToken();
        success = IERC20(zetaToken).approve(address(uniswapV3Router), zetaTokenAmount);
        if (!success) revert ErrorGettingToken();

        ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
            deadline: block.timestamp + MAX_DEADLINE,
            path: abi.encodePacked(zetaToken, zetaPoolFee, WETH9Address, tokenPoolFee, outputToken),
            recipient: destinationAddress,
            amountIn: zetaTokenAmount,
            amountOutMinimum: minAmountOut
        });

        uint256 amountOut = uniswapV3Router.exactInput(params);

        emit ZetaExchangedForToken(outputToken, zetaTokenAmount, amountOut);
        return amountOut;
    }
}
