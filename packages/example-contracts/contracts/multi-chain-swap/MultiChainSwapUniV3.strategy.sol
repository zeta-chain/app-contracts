// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaTokenConsumerUniV3.strategy.sol";

import "./MultiChainSwapErrors.sol";
import "./MultiChainSwap.sol";

contract MultiChainSwapUniV3 is MultiChainSwap, ZetaInteractor, MultiChainSwapErrors, ZetaTokenConsumerUniV3 {
    using SafeERC20 for IERC20;
    bytes32 public constant CROSS_CHAIN_SWAP_MESSAGE = keccak256("CROSS_CHAIN_SWAP");

    constructor(
        address zetaConnector_,
        address zetaToken_,
        address uniswapV3Router_,
        address uniswapV3Factory_,
        address WETH9Address_,
        uint24 zetaPoolFee_,
        uint24 tokenPoolFee_
    )
        ZetaTokenConsumerUniV3(
            zetaToken_,
            uniswapV3Router_,
            uniswapV3Factory_,
            WETH9Address_,
            zetaPoolFee_,
            tokenPoolFee_
        )
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
        uint256 crossChaindestinationGasLimit,
        uint /* deadline */
    ) external payable override {
        _swapETHForTokensCrossChain(
            receiverAddress,
            destinationOutToken,
            isDestinationOutETH,
            outTokenMinAmount,
            destinationChainId,
            crossChaindestinationGasLimit
        );
    }

    function _swapETHForTokensCrossChain(
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
    ) internal {
        if (!_isValidChainId(destinationChainId)) revert InvalidDestinationChainId();

        if (msg.value == 0) revert ValueShouldBeGreaterThanZero();
        if (
            (destinationOutToken != address(0) && isDestinationOutETH) ||
            (destinationOutToken == address(0) && !isDestinationOutETH)
        ) revert OutTokenInvariant();

        uint256 zetaValueAndGas = this.getZetaFromEth{value: msg.value}(
            address(this),
            0 /// @todo Add min amount
        );
        if (zetaValueAndGas == 0) revert ErrorSwappingTokens();

        IERC20(zetaToken).safeApprove(address(connector), zetaValueAndGas);

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: interactorsByChainId[destinationChainId],
                destinationGasLimit: crossChaindestinationGasLimit,
                message: abi.encode(
                    CROSS_CHAIN_SWAP_MESSAGE,
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
        uint256 crossChaindestinationGasLimit,
        uint /* deadline */
    ) external override {
        _swapTokensForTokensCrossChain(
            sourceInputToken,
            inputTokenAmount,
            receiverAddress,
            destinationOutToken,
            isDestinationOutETH,
            outTokenMinAmount,
            destinationChainId,
            crossChaindestinationGasLimit
        );
    }

    function _swapTokensForTokensCrossChain(
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
    ) internal {
        if (!_isValidChainId(destinationChainId)) revert InvalidDestinationChainId();

        if (sourceInputToken == address(0)) revert MissingSourceInputTokenAddress();
        if (
            (destinationOutToken != address(0) && isDestinationOutETH) ||
            (destinationOutToken == address(0) && !isDestinationOutETH)
        ) revert OutTokenInvariant();

        uint256 zetaValueAndGas;

        IERC20(sourceInputToken).safeTransferFrom(msg.sender, address(this), inputTokenAmount);

        if (sourceInputToken == zetaToken) {
            zetaValueAndGas = inputTokenAmount;
        } else {
            IERC20(sourceInputToken).safeApprove(address(this), inputTokenAmount);
            zetaValueAndGas = this.getZetaFromToken(
                address(this),
                0, /// @todo Add min amount
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
                    CROSS_CHAIN_SWAP_MESSAGE,
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

    function onZetaMessage(
        ZetaInterfaces.ZetaMessage calldata zetaMessage
    ) external override isValidMessageCall(zetaMessage) {
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
        if (messageType != CROSS_CHAIN_SWAP_MESSAGE) revert InvalidMessageType();

        uint256 outTokenFinalAmount;
        if (destinationOutToken == zetaToken) {
            if (zetaMessage.zetaValue < outTokenMinAmount) revert InsufficientOutToken();

            IERC20(zetaToken).safeTransfer(address(uint160(bytes20(receiverAddressEncoded))), zetaMessage.zetaValue);

            outTokenFinalAmount = zetaMessage.zetaValue;
        } else {
            /**
             * @dev If the out token is not Zeta, get it using Uniswap
             */
            IERC20(zetaToken).safeApprove(address(this), zetaMessage.zetaValue);

            if (isDestinationOutETH) {
                outTokenFinalAmount = this.getEthFromZeta(
                    address(uint160(bytes20(receiverAddressEncoded))),
                    outTokenMinAmount,
                    zetaMessage.zetaValue
                );
            } else {
                outTokenFinalAmount = this.getTokenFromZeta(
                    address(uint160(bytes20(receiverAddressEncoded))),
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
            address(uint160(bytes20(receiverAddressEncoded)))
        );
    }

    function onZetaRevert(
        ZetaInterfaces.ZetaRevert calldata zetaRevert
    ) external override isValidRevertCall(zetaRevert) {
        /**
         * @dev If something goes wrong we must swap to the source input token
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
            IERC20(zetaToken).safeApprove(address(this), zetaRevert.remainingZetaValue);
            IERC20(zetaToken).safeTransferFrom(address(this), sourceTxOrigin, zetaRevert.remainingZetaValue);
            inputTokenReturnedAmount = zetaRevert.remainingZetaValue;
        } else {
            /**
             * @dev If the source input token is not Zeta, trade it using Uniswap
             */
            IERC20(zetaToken).safeApprove(address(this), zetaRevert.remainingZetaValue);

            if (inputTokenIsETH) {
                inputTokenReturnedAmount = this.getEthFromZeta(
                    sourceTxOrigin,
                    0, /// @todo Add min amount
                    zetaRevert.remainingZetaValue
                );
            } else {
                inputTokenReturnedAmount = this.getTokenFromZeta(
                    sourceTxOrigin,
                    0, /// @todo Add min amount
                    sourceInputToken,
                    zetaRevert.remainingZetaValue
                );
            }
        }

        emit RevertedSwap(sourceTxOrigin, sourceInputToken, inputTokenAmount, inputTokenReturnedAmount);
    }
}
