// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";
import "@zetachain/protocol-contracts/contracts/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/interfaces/ZetaInterfaces.sol";

import "./MultiChainSwapErrors.sol";
import "./MultiChainSwap.sol";

interface WETH9 {
    function withdraw(uint256 wad) external;
}

interface MultiChainSwapUniV3Errors {
    error InvalidAddress();

    error ErrorSendingETH();
}

contract MultiChainSwapPlainUniV3 is MultiChainSwap, ZetaInteractor, MultiChainSwapErrors, MultiChainSwapUniV3Errors {
    using SafeERC20 for IERC20;
    uint256 internal constant MAX_DEADLINE = 200;

    bytes32 public constant CROSS_CHAIN_SWAP_MESSAGE = keccak256("CROSS_CHAIN_SWAP");

    uint24 public immutable zetaPoolFee;
    uint24 public immutable tokenPoolFee;

    address internal immutable WETH9Address;
    address public immutable zetaToken;

    ISwapRouter public immutable uniswapV3Router;
    IQuoter public immutable quoter;

    bool internal _locked;

    constructor(
        address zetaConnector_,
        address zetaToken_,
        address uniswapV3Router_,
        address quoter_,
        address WETH9Address_,
        uint24 zetaPoolFee_,
        uint24 tokenPoolFee_
    ) ZetaInteractor(zetaConnector_) {
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

        uint256 zetaValueAndGas;
        {
            address[] memory path = new address[](2);
            path[0] = WETH9Address;
            path[1] = zetaToken;

            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
                deadline: block.timestamp + MAX_DEADLINE,
                tokenIn: WETH9Address,
                tokenOut: zetaToken,
                fee: zetaPoolFee,
                recipient: address(this),
                amountIn: msg.value,
                amountOutMinimum: 0, /// @dev Output can't be validated here, it's validated after the next swap
                sqrtPriceLimitX96: 0
            });

            zetaValueAndGas = uniswapV3Router.exactInputSingle{value: msg.value}(params);
        }
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
            /**
             * @dev If the input token is not Zeta, trade it using Uniswap
             */
            IERC20(sourceInputToken).safeTransferFrom(msg.sender, address(this), inputTokenAmount);
            IERC20(sourceInputToken).safeApprove(address(uniswapV3Router), inputTokenAmount);

            bytes memory path;
            if (sourceInputToken == WETH9Address) {
                path = abi.encodePacked(WETH9Address, zetaPoolFee, zetaToken);
            } else {
                path = abi.encodePacked(sourceInputToken, tokenPoolFee, WETH9Address, zetaPoolFee, zetaToken);
            }

            ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
                deadline: block.timestamp + MAX_DEADLINE,
                path: path,
                recipient: address(this),
                amountIn: inputTokenAmount,
                amountOutMinimum: 0 /// @dev Output can't be validated here, it's validated after the next swap
            });

            zetaValueAndGas = uniswapV3Router.exactInput(params);

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

        if (messageType != CROSS_CHAIN_SWAP_MESSAGE) revert InvalidMessageType();

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
                ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
                    deadline: block.timestamp + MAX_DEADLINE,
                    tokenIn: zetaToken,
                    tokenOut: WETH9Address,
                    fee: zetaPoolFee,
                    recipient: address(this),
                    amountIn: zetaMessage.zetaValue,
                    amountOutMinimum: outTokenMinAmount,
                    sqrtPriceLimitX96: 0
                });
                outTokenFinalAmount = uniswapV3Router.exactInputSingle(params);

                WETH9(WETH9Address).withdraw(outTokenFinalAmount);

                (bool sent, ) = receiverAddress.call{value: outTokenFinalAmount}("");
                if (!sent) revert ErrorSendingETH();
            } else {
                ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
                    deadline: block.timestamp + MAX_DEADLINE,
                    path: abi.encodePacked(zetaToken, zetaPoolFee, WETH9Address, tokenPoolFee, destinationOutToken),
                    recipient: receiverAddress,
                    amountIn: zetaMessage.zetaValue,
                    amountOutMinimum: outTokenMinAmount
                });

                outTokenFinalAmount = uniswapV3Router.exactInput(params);
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
                ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
                    deadline: block.timestamp + MAX_DEADLINE,
                    path: abi.encodePacked(zetaToken, zetaPoolFee, WETH9Address),
                    recipient: address(this),
                    amountIn: zetaRevert.remainingZetaValue,
                    amountOutMinimum: 0 /// @dev Any output is fine, otherwise the value will be stuck in the contract
                });

                inputTokenReturnedAmount = uniswapV3Router.exactInput(params);

                WETH9(WETH9Address).withdraw(inputTokenReturnedAmount);

                (bool sent, ) = sourceTxOrigin.call{value: inputTokenReturnedAmount}("");
                if (!sent) revert ErrorSendingETH();
            } else {
                ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
                    deadline: block.timestamp + MAX_DEADLINE,
                    path: abi.encodePacked(zetaToken, zetaPoolFee, WETH9Address, tokenPoolFee, sourceInputToken),
                    recipient: sourceTxOrigin,
                    amountIn: zetaRevert.remainingZetaValue,
                    amountOutMinimum: 0 /// @dev Any output is fine, otherwise the value will be stuck in the contract
                });

                inputTokenReturnedAmount = uniswapV3Router.exactInput(params);
            }
        }

        emit RevertedSwap(sourceTxOrigin, sourceInputToken, inputTokenAmount, inputTokenReturnedAmount);
    }
}
