// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";

import "./interfaces/ZetaInterfaces.sol";

interface ZetaTokenConsumerRecommendedErrors {
    error ErrorGettingZeta();

    error ErrorExchangingZeta();
}

/**
 * @dev Recommended strategy for ZetaTokenConsumer
 */
contract ZetaTokenConsumerRecommended is ZetaTokenConsumer, ZetaTokenConsumerRecommendedErrors {
    address public strategyAddress;
    address public zetaToken;

    constructor(address strategyAddress_, address zetaToken_) {
        strategyAddress = strategyAddress_;
        zetaToken = zetaToken_;
    }

    receive() external payable {}

    fallback() external payable {}

    function getZetaFromEth(address destinationAddress, uint256 minAmountOut) external payable override {
        ZetaTokenConsumer(strategyAddress).getZetaFromEth{value: msg.value}(destinationAddress, minAmountOut);
    }

    function getZetaFromToken(
        address destinationAddress,
        uint256 minAmountOut,
        address inputToken,
        uint256 inputTokenAmount
    ) external override {
        bool success = IERC20(inputToken).transferFrom(msg.sender, address(this), inputTokenAmount);
        if (!success) revert ErrorGettingZeta();
        success = IERC20(inputToken).approve(strategyAddress, inputTokenAmount);
        if (!success) revert ErrorGettingZeta();

        ZetaTokenConsumer(strategyAddress).getZetaFromToken(
            destinationAddress,
            minAmountOut,
            inputToken,
            inputTokenAmount
        );
    }

    function getEthFromZeta(
        address destinationAddress,
        uint256 minAmountOut,
        uint256 zetaTokenAmount
    ) external override {
        bool success = IERC20(zetaToken).transferFrom(msg.sender, address(this), zetaTokenAmount);
        if (!success) revert ErrorGettingZeta();
        success = IERC20(zetaToken).approve(strategyAddress, zetaTokenAmount);
        if (!success) revert ErrorGettingZeta();

        ZetaTokenConsumer(strategyAddress).getEthFromZeta(destinationAddress, minAmountOut, zetaTokenAmount);
    }

    function getTokenFromZeta(
        address destinationAddress,
        uint256 minAmountOut,
        address outputToken,
        uint256 zetaTokenAmount
    ) external override {
        bool success = IERC20(zetaToken).transferFrom(msg.sender, address(this), zetaTokenAmount);
        if (!success) revert ErrorGettingZeta();
        success = IERC20(zetaToken).approve(strategyAddress, zetaTokenAmount);
        if (!success) revert ErrorGettingZeta();

        ZetaTokenConsumer(strategyAddress).getTokenFromZeta(
            destinationAddress,
            minAmountOut,
            outputToken,
            zetaTokenAmount
        );
    }

    //@todo: only tss
    function updateStrategy(address strategyAddress_) external {
        strategyAddress = strategyAddress_;
    }
}
