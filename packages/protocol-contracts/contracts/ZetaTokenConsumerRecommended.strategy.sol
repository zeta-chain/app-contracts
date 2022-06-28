// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";

import "./interfaces/ZetaInterfaces.sol";

interface ZetaTokenConsumerRecommendedErrors {
    error InvalidAddress();

    error ErrorGettingZeta();

    error ErrorExchangingZeta();

    error CallerIsNotTssOrUpdater(address caller);
}

/**
 * @dev Recommended strategy for ZetaTokenConsumer
 * @dev ZetaTokenConsumer events are not emitted here because this contract relies on a selected strategy that should emit them
 */
contract ZetaTokenConsumerRecommended is ZetaTokenConsumer, ZetaTokenConsumerRecommendedErrors {
    /**
     * @dev Collectively hold by Zeta blockchain validators
     */
    address public tssAddress;

    /**
     * @dev Initially a multi-sig, eventually hold by Zeta blockchain validators (via renounceTssAddressUpdater)
     */
    address public tssAddressUpdater;

    address public strategyAddress;
    address public zetaToken;

    constructor(
        address strategyAddress_,
        address zetaToken_,
        address tssAddress_,
        address tssAddressUpdater_
    ) {
        if (
            strategyAddress_ == address(0) ||
            zetaToken_ == address(0) ||
            tssAddress_ == address(0) ||
            tssAddressUpdater_ == address(0)
        ) revert InvalidAddress();

        strategyAddress = strategyAddress_;
        zetaToken = zetaToken_;
        tssAddress = tssAddress_;
        tssAddressUpdater = tssAddressUpdater_;
    }

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

    function updateStrategy(address strategyAddress_) external {
        if (msg.sender != tssAddress || msg.sender != tssAddressUpdater) revert CallerIsNotTssOrUpdater(msg.sender);
        if (strategyAddress_ == address(0)) revert InvalidAddress();

        strategyAddress = strategyAddress_;
    }
}
