// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

import "./interfaces/ZetaInterfaces.sol";

interface ZetaTokenConsumerUniV2Errors {
    error InvalidAddress();

    error InputCantBeZero();

    error ErrorGettingZeta();

    error ErrorExchangingZeta();
}

/**
 * @dev Uniswap V2 strategy for ZetaTokenConsumer
 */
contract ZetaTokenConsumerUniV2 is ZetaTokenConsumer, ZetaTokenConsumerUniV2Errors {
    uint256 internal constant MAX_DEADLINE = 200;

    address internal immutable wETH;
    address public immutable zetaToken;

    IUniswapV2Router02 internal immutable uniswapV2Router;

    constructor(address zetaToken_, address uniswapV2Router_) {
        if (zetaToken_ == address(0) || uniswapV2Router_ == address(0)) revert InvalidAddress();

        zetaToken = zetaToken_;
        uniswapV2Router = IUniswapV2Router02(uniswapV2Router_);
        wETH = IUniswapV2Router02(uniswapV2Router_).WETH();
    }

    function getZetaFromEth(address destinationAddress, uint256 minAmountOut)
        external
        payable
        override
        returns (uint256)
    {
        if (destinationAddress == address(0)) revert InvalidAddress();
        if (msg.value == 0) revert InputCantBeZero();

        address[] memory path = new address[](2);
        path[0] = wETH;
        path[1] = zetaToken;

        uint256[] memory amounts = uniswapV2Router.swapExactETHForTokens{value: msg.value}(
            minAmountOut,
            path,
            destinationAddress,
            block.timestamp + MAX_DEADLINE
        );

        uint256 amountOut = amounts[path.length - 1];

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
        if (!success) revert ErrorGettingZeta();
        success = IERC20(inputToken).approve(address(uniswapV2Router), inputTokenAmount);
        if (!success) revert ErrorGettingZeta();

        address[] memory path;
        if (inputToken == wETH) {
            path = new address[](2);
            path[0] = wETH;
            path[1] = zetaToken;
        } else {
            path = new address[](3);
            path[0] = inputToken;
            path[1] = wETH;
            path[2] = zetaToken;
        }

        uint256[] memory amounts = uniswapV2Router.swapExactTokensForTokens(
            inputTokenAmount,
            minAmountOut,
            path,
            destinationAddress,
            block.timestamp + MAX_DEADLINE
        );
        uint256 amountOut = amounts[path.length - 1];

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
        if (!success) revert ErrorExchangingZeta();
        success = IERC20(zetaToken).approve(address(uniswapV2Router), zetaTokenAmount);
        if (!success) revert ErrorExchangingZeta();

        address[] memory path = new address[](2);
        path[0] = zetaToken;
        path[1] = wETH;

        uint256[] memory amounts = uniswapV2Router.swapExactTokensForETH(
            zetaTokenAmount,
            minAmountOut,
            path,
            destinationAddress,
            block.timestamp + MAX_DEADLINE
        );

        uint256 amountOut = amounts[path.length - 1];

        emit ZetaExchangedForEth(zetaTokenAmount, amountOut);
        return amountOut;
    }

    function getTokenFromZeta(
        address destinationAddress,
        uint256 minAmountOut,
        address outputToken,
        uint256 zetaTokenAmount
    ) external override returns (uint256) {
        if (destinationAddress == address(0) || outputToken == address(0)) revert InvalidAddress();
        if (zetaTokenAmount == 0) revert InputCantBeZero();

        bool success = IERC20(zetaToken).transferFrom(msg.sender, address(this), zetaTokenAmount);
        if (!success) revert ErrorExchangingZeta();
        success = IERC20(zetaToken).approve(address(uniswapV2Router), zetaTokenAmount);
        if (!success) revert ErrorExchangingZeta();

        address[] memory path;
        if (outputToken == wETH) {
            path = new address[](2);
            path[0] = zetaToken;
            path[1] = wETH;
        } else {
            path = new address[](3);
            path[0] = zetaToken;
            path[1] = wETH;
            path[2] = outputToken;
        }

        uint256[] memory amounts = uniswapV2Router.swapExactTokensForTokens(
            zetaTokenAmount,
            minAmountOut,
            path,
            destinationAddress,
            block.timestamp + MAX_DEADLINE
        );

        uint256 amountOut = amounts[path.length - 1];

        emit ZetaExchangedForToken(outputToken, zetaTokenAmount, amountOut);
        return amountOut;
    }
}
