// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

import "./interfaces/ZetaInterfaces.sol";

interface ZetaTokenConsumerUniV2Errors {
    error ErrorSwappingTokens();
}

/**
 * @dev Uniswap V2 strategy for ZetaTokenConsumer
 */
contract ZetaTokenConsumerUniV2 is ZetaTokenConsumer, ZetaTokenConsumerUniV2Errors {
    /**
     * @custom:todo (lucas): explain why 365
     */
    uint256 internal constant MAX_DEADLINE = 365;

    address public uniswapV2RouterAddress;
    address internal immutable wETH;
    address public zetaToken;

    IUniswapV2Router02 internal uniswapV2Router;

    constructor(address zetaTokenInput_, address uniswapV2Router_) {
        zetaToken = zetaTokenInput_;
        uniswapV2RouterAddress = uniswapV2Router_;
        uniswapV2Router = IUniswapV2Router02(uniswapV2Router_);
        wETH = uniswapV2Router.WETH();
    }

    function getZetaFromEth(uint256 minAmount) external payable override {
        address[] memory path = new address[](2);
        path[0] = wETH;
        path[1] = zetaToken;

        uint256[] memory amounts = uniswapV2Router.swapExactETHForTokens{value: msg.value}(
            minAmount,
            path,
            address(this),
            block.timestamp + MAX_DEADLINE
        );

        uint256 zetaAmount = amounts[path.length - 1];

        if (zetaAmount == 0) revert ErrorSwappingTokens();
    }

    function getZetaFromToken(uint256 minAmount) external override {
        //
    }

    function getEthFromZeta(uint256 minAmount) external payable override {
        //
    }

    function getTokenFromZeta(uint256 minAmount) external override {
        //
    }
}
