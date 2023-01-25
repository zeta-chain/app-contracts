// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

import "./MultiChainSwapErrors.sol";
import "./MultiChainSwap.sol";

contract MultiChainSwapUniV2 is MultiChainSwap, ZetaInteractor, MultiChainSwapErrors {
    using SafeERC20 for IERC20;
    uint16 internal constant MAX_DEADLINE = 200;
    bytes32 public constant CROSS_CHAIN_SWAP_MESSAGE = keccak256("CROSS_CHAIN_SWAP");

    address public immutable uniswapV2RouterAddress;
    address internal immutable wETH;
    address public immutable zetaToken;

    IUniswapV2Router02 internal uniswapV2Router;

    constructor(address zetaConnector_, address zetaToken_, address uniswapV2Router_) ZetaInteractor(zetaConnector_) {
        if (zetaToken_ == address(0) || uniswapV2Router_ == address(0)) revert ZetaCommonErrors.InvalidAddress();
        zetaToken = zetaToken_;
        uniswapV2RouterAddress = uniswapV2Router_;
        uniswapV2Router = IUniswapV2Router02(uniswapV2Router_);
        wETH = uniswapV2Router.WETH();
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
            path[0] = wETH;
            path[1] = zetaToken;

            uint256[] memory amounts = uniswapV2Router.swapExactETHForTokens{value: msg.value}(
                0, /// @todo Add min amount
                path,
                address(this),
                block.timestamp + MAX_DEADLINE
            );

            zetaValueAndGas = amounts[path.length - 1];
        }
        if (zetaValueAndGas == 0) revert ErrorSwappingTokens();

        {
            bool success = IERC20(zetaToken).approve(address(connector), zetaValueAndGas);
            if (!success) revert ErrorApprovingTokens(zetaToken);
        }

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: interactorsByChainId[destinationChainId],
                destinationGasLimit: crossChaindestinationGasLimit,
                message: abi.encode(
                    CROSS_CHAIN_SWAP_MESSAGE,
                    msg.sender,
                    wETH,
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
            bool success1 = IERC20(zetaToken).transferFrom(msg.sender, address(this), inputTokenAmount);
            bool success2 = IERC20(zetaToken).approve(address(connector), inputTokenAmount);
            if (!success1 || !success2) revert ErrorTransferringTokens(zetaToken);

            zetaValueAndGas = inputTokenAmount;
        } else {
            /**
             * @dev If the input token is not Zeta, trade it using Uniswap
             */
            {
                IERC20(sourceInputToken).safeTransferFrom(msg.sender, address(this), inputTokenAmount);
                IERC20(sourceInputToken).safeApprove(uniswapV2RouterAddress, inputTokenAmount);
            }

            address[] memory path;
            if (sourceInputToken == wETH) {
                path = new address[](2);
                path[0] = wETH;
                path[1] = zetaToken;
            } else {
                path = new address[](3);
                path[0] = sourceInputToken;
                path[1] = wETH;
                path[2] = zetaToken;
            }

            uint256[] memory amounts = uniswapV2Router.swapExactTokensForTokens(
                inputTokenAmount,
                0, /// @todo Add min amount
                path,
                address(this),
                block.timestamp + MAX_DEADLINE
            );

            zetaValueAndGas = amounts[path.length - 1];
            if (zetaValueAndGas == 0) revert ErrorSwappingTokens();
        }

        {
            bool success = IERC20(zetaToken).approve(address(connector), zetaValueAndGas);
            if (!success) revert ErrorApprovingTokens(zetaToken);
        }

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

        address receiverAddress = address(uint160(bytes20(receiverAddressEncoded)));

        if (messageType != CROSS_CHAIN_SWAP_MESSAGE) revert InvalidMessageType();

        uint256 outTokenFinalAmount;
        if (destinationOutToken == zetaToken) {
            if (zetaMessage.zetaValue < outTokenMinAmount) revert InsufficientOutToken();

            bool success = IERC20(zetaToken).transfer(receiverAddress, zetaMessage.zetaValue);
            if (!success) revert ErrorTransferringTokens(zetaToken);

            outTokenFinalAmount = zetaMessage.zetaValue;
        } else {
            /**
             * @dev If the out token is not Zeta, get it using Uniswap
             */
            {
                bool success = IERC20(zetaToken).approve(uniswapV2RouterAddress, zetaMessage.zetaValue);
                if (!success) revert ErrorApprovingTokens(zetaToken);
            }

            address[] memory path;
            if (destinationOutToken == wETH || isDestinationOutETH) {
                path = new address[](2);
                path[0] = zetaToken;
                path[1] = wETH;
            } else {
                path = new address[](3);
                path[0] = zetaToken;
                path[1] = wETH;
                path[2] = destinationOutToken;
            }

            uint256[] memory amounts;
            if (isDestinationOutETH) {
                amounts = uniswapV2Router.swapExactTokensForETH(
                    zetaMessage.zetaValue,
                    outTokenMinAmount,
                    path,
                    receiverAddress,
                    block.timestamp + MAX_DEADLINE
                );
            } else {
                amounts = uniswapV2Router.swapExactTokensForTokens(
                    zetaMessage.zetaValue,
                    outTokenMinAmount,
                    path,
                    receiverAddress,
                    block.timestamp + MAX_DEADLINE
                );
            }

            outTokenFinalAmount = amounts[amounts.length - 1];
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

    function onZetaRevert(
        ZetaInterfaces.ZetaRevert calldata zetaRevert
    ) external override isValidRevertCall(zetaRevert) {
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
            {
                bool success = IERC20(zetaToken).approve(uniswapV2RouterAddress, zetaRevert.remainingZetaValue);
                if (!success) revert ErrorTransferringTokens(zetaToken);
            }

            address[] memory path;
            if (sourceInputToken == wETH) {
                path = new address[](2);
                path[0] = zetaToken;
                path[1] = wETH;
            } else {
                path = new address[](3);
                path[0] = zetaToken;
                path[1] = wETH;
                path[2] = sourceInputToken;
            }
            {
                uint256[] memory amounts;

                if (inputTokenIsETH) {
                    amounts = uniswapV2Router.swapExactTokensForETH(
                        zetaRevert.remainingZetaValue,
                        0, /// @todo Add min amount
                        path,
                        sourceTxOrigin,
                        block.timestamp + MAX_DEADLINE
                    );
                } else {
                    amounts = uniswapV2Router.swapExactTokensForTokens(
                        zetaRevert.remainingZetaValue,
                        0, /// @todo Add min amount
                        path,
                        sourceTxOrigin,
                        block.timestamp + MAX_DEADLINE
                    );
                }
                inputTokenReturnedAmount = amounts[amounts.length - 1];
            }
        }

        emit RevertedSwap(sourceTxOrigin, sourceInputToken, inputTokenAmount, inputTokenReturnedAmount);
    }
}
