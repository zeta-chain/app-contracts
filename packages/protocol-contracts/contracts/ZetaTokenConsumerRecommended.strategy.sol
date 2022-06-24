// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./interfaces/ZetaInterfaces.sol";

/**
 * @dev Recommended strategy for ZetaTokenConsumer
 */
contract ZetaTokenConsumerRecommended is ZetaTokenConsumer {
    address public strategyAddress;

    constructor(address strategyAddress_) {
        strategyAddress = strategyAddress_;
    }

    function getZetaFromEth(uint256 minAmountOut) external payable override {
        ZetaTokenConsumer(strategyAddress).getZetaFromEth(minAmountOut);
    }

    function getZetaFromToken(
        uint256 minAmountOut,
        address inputToken,
        uint256 inputTokenAmount
    ) external override {
        ZetaTokenConsumer(strategyAddress).getZetaFromToken(minAmountOut, inputToken, inputTokenAmount);
    }

    function getEthFromZeta(uint256 minAmountOut, uint256 zetaTokenAmount) external override {
        ZetaTokenConsumer(strategyAddress).getEthFromZeta(minAmountOut, zetaTokenAmount);
    }

    function getTokenFromZeta(
        uint256 minAmountOut,
        address outputToken,
        uint256 zetaTokenAmount
    ) external override {
        ZetaTokenConsumer(strategyAddress).getTokenFromZeta(minAmountOut, outputToken, zetaTokenAmount);
    }

    function updateStrategy(address strategyAddress_) external {
        strategyAddress = strategyAddress_;
    }
}
