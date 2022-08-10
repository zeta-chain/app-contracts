// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";
import "@zetachain/protocol-contracts/contracts/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/interfaces/ZetaInterfaces.sol";
import "@zetachain/protocol-contracts/contracts/ZetaTokenConsumerUniV3.strategy.sol";

import "./MultiChainSwapErrors.sol";
import "./MultiChainSwap.sol";

contract MultiChainSwapUniV3 is MultiChainSwap, ZetaInteractor, MultiChainSwapErrors, ZetaTokenConsumerUniV3 {
    using SafeERC20 for IERC20;
    bytes32 public constant CROSS_CHAIN_SWAP_MESSAGE_V3 = keccak256("CROSS_CHAIN_SWAP_V3");

    constructor(
        address zetaConnector_,
        address zetaToken_,
        address uniswapV3Router_,
        address quoter_,
        address WETH9Address_,
        uint24 zetaPoolFee_,
        uint24 tokenPoolFee_
    )
        ZetaTokenConsumerUniV3(zetaToken_, uniswapV3Router_, quoter_, WETH9Address_, zetaPoolFee_, tokenPoolFee_)
        ZetaInteractor(zetaConnector_)
    {}

    function swapETHForTokensCrossChain(
        bytes calldata receiverAddress,
        address destinationOutToken,
        bool isDestinationOutETH,
        /**
         * @dev The minimum amount of tokens that receiverAddress should get,
         * if it's not reached, the transaction will revert on the destination chain
         */
        uint256 outTokenMinAmount,
        uint256 destinationChainId,
        uint256 crossChaindestinationGasLimit
    ) external payable override {
        if (!_isValidChainId(destinationChainId)) revert InvalidDestinationChainId();

        if (msg.value == 0) revert ValueShouldBeGreaterThanZero();
        if (
            (destinationOutToken != address(0) && isDestinationOutETH) ||
            (destinationOutToken == address(0) && !isDestinationOutETH)
        ) revert OutTokenInvariant();

        uint256 zetaValueAndGas = this.getZetaFromEth(
            address(this),
            0 /// @dev Output can't be validated here, it's validated after the next swap
        );
        if (zetaValueAndGas == 0) revert ErrorSwappingTokens();

        IERC20(zetaToken).safeApprove(address(connector), zetaValueAndGas);

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: interactorsByChainId[destinationChainId],
                destinationGasLimit: crossChaindestinationGasLimit,
                message: abi.encode(
                    CROSS_CHAIN_SWAP_MESSAGE_V3,
                    msg.sender,
                    WETH9Address,
                    msg.value,
                    receiverAddress,
                    destinationOutToken,
                    isDestinationOutETH,
                    outTokenMinAmount,
                    true // inputTokenIsETH
                ),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function swapTokensForTokensCrossChain(
        address sourceInputToken,
        uint256 inputTokenAmount,
        bytes calldata receiverAddress,
        address destinationOutToken,
        bool isDestinationOutETH,
        /**
         * @dev The minimum amount of tokens that receiverAddress should get,
         * if it's not reached, the transaction will revert on the destination chain
         */
        uint256 outTokenMinAmount,
        uint256 destinationChainId,
        uint256 crossChaindestinationGasLimit
    ) external override {
        if (!_isValidChainId(destinationChainId)) revert InvalidDestinationChainId();

        if (sourceInputToken == address(0)) revert MissingSourceInputTokenAddress();
        if (
            (destinationOutToken != address(0) && isDestinationOutETH) ||
            (destinationOutToken == address(0) && !isDestinationOutETH)
        ) revert OutTokenInvariant();

        uint256 zetaValueAndGas;

        if (sourceInputToken == zetaToken) {
            IERC20(zetaToken).safeTransferFrom(msg.sender, address(this), inputTokenAmount);
            IERC20(zetaToken).safeApprove(address(connector), inputTokenAmount);

            zetaValueAndGas = inputTokenAmount;
        } else {
            zetaValueAndGas = this.getZetaFromToken(
                address(this),
                0, /// @dev Output can't be validated here, it's validated after the next swap
                sourceInputToken,
                inputTokenAmount
            );

            if (zetaValueAndGas == 0) revert ErrorSwappingTokens();
        }

        IERC20(zetaToken).safeApprove(address(connector), zetaValueAndGas);

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: interactorsByChainId[destinationChainId],
                destinationGasLimit: crossChaindestinationGasLimit,
                message: abi.encode(
                    CROSS_CHAIN_SWAP_MESSAGE_V3,
                    msg.sender,
                    sourceInputToken,
                    inputTokenAmount,
                    receiverAddress,
                    destinationOutToken,
                    isDestinationOutETH,
                    outTokenMinAmount,
                    false // inputTokenIsETH
                ),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata zetaMessage)
        external
        override
        isValidMessageCall(zetaMessage)
    {
        (
            bytes32 messageType,
            address sourceTxOrigin,
            address sourceInputToken,
            uint256 inputTokenAmount,
            bytes memory receiverAddressEncoded,
            address destinationOutToken,
            bool isDestinationOutETH,
            uint256 outTokenMinAmount,

        ) = abi.decode(zetaMessage.message, (bytes32, address, address, uint256, bytes, address, bool, uint256, bool));

        address receiverAddress = address(uint160(bytes20(receiverAddressEncoded)));

        if (messageType != CROSS_CHAIN_SWAP_MESSAGE_V3) revert InvalidMessageType();

        uint256 outTokenFinalAmount;
        if (destinationOutToken == zetaToken) {
            if (zetaMessage.zetaValue < outTokenMinAmount) revert InsufficientOutToken();

            IERC20(zetaToken).safeTransfer(receiverAddress, zetaMessage.zetaValue);

            outTokenFinalAmount = zetaMessage.zetaValue;
        } else {
            /**
             * @dev If the out token is not Zeta, get it using Uniswap
             */
            IERC20(zetaToken).safeApprove(address(uniswapV3Router), zetaMessage.zetaValue);

            if (isDestinationOutETH) {
                outTokenFinalAmount = this.getEthFromZeta(address(this), outTokenMinAmount, zetaMessage.zetaValue);

                WETH9(WETH9Address).withdraw(outTokenFinalAmount);

                (bool sent, ) = receiverAddress.call{value: outTokenFinalAmount}("");
                if (!sent) revert ErrorSendingETH();
            } else {
                outTokenFinalAmount = this.getTokenFromZeta(
                    receiverAddress,
                    outTokenMinAmount,
                    destinationOutToken,
                    zetaMessage.zetaValue
                );
            }

            if (outTokenFinalAmount == 0) revert ErrorSwappingTokens();
            if (outTokenFinalAmount < outTokenMinAmount) revert InsufficientOutToken();
        }

        emit Swapped(
            sourceTxOrigin,
            sourceInputToken,
            inputTokenAmount,
            destinationOutToken,
            outTokenFinalAmount,
            receiverAddress
        );
    }

    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata zetaRevert)
        external
        override
        isValidRevertCall(zetaRevert)
    {
        /**
         * @dev: If something goes wrong we must swap to the source input token
         */
        (
            ,
            address sourceTxOrigin,
            address sourceInputToken,
            uint256 inputTokenAmount,
            ,
            ,
            ,
            ,
            bool inputTokenIsETH
        ) = abi.decode(zetaRevert.message, (bytes32, address, address, uint256, bytes, address, bool, uint256, bool));

        uint256 inputTokenReturnedAmount;
        if (sourceInputToken == zetaToken) {
            bool success1 = IERC20(zetaToken).approve(address(this), zetaRevert.remainingZetaValue);
            bool success2 = IERC20(zetaToken).transferFrom(
                address(this),
                sourceTxOrigin,
                zetaRevert.remainingZetaValue
            );
            if (!success1 || !success2) revert ErrorTransferringTokens(zetaToken);
            inputTokenReturnedAmount = zetaRevert.remainingZetaValue;
        } else {
            /**
             * @dev If the source input token is not Zeta, trade it using Uniswap
             */
            IERC20(zetaToken).safeApprove(address(uniswapV3Router), zetaRevert.remainingZetaValue);

            if (inputTokenIsETH) {
                inputTokenReturnedAmount = this.getEthFromZeta(
                    address(this),
                    0, /// @dev Any output is fine, otherwise the value will be stuck in the contract
                    zetaRevert.remainingZetaValue
                );

                WETH9(WETH9Address).withdraw(inputTokenReturnedAmount);

                (bool sent, ) = sourceTxOrigin.call{value: inputTokenReturnedAmount}("");
                if (!sent) revert ErrorSendingETH();
            } else {
                inputTokenReturnedAmount = this.getTokenFromZeta(
                    sourceTxOrigin,
                    0, /// @dev Any output is fine, otherwise the value will be stuck in the contract
                    sourceInputToken,
                    zetaRevert.remainingZetaValue
                );
            }
        }

        emit RevertedSwap(sourceTxOrigin, sourceInputToken, inputTokenAmount, inputTokenReturnedAmount);
    }
}
