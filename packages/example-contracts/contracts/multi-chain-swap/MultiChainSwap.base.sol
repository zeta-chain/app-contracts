// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@zetachain/protocol-contracts/contracts/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/interfaces/ZetaInterfaces.sol";

import "./MultiChainSwapErrors.sol";

contract MultiChainSwapBase is ZetaInteractor, ZetaReceiver, MultiChainSwapErrors {
    uint16 internal constant MAX_DEADLINE = 365;
    bytes32 public constant CROSS_CHAIN_SWAP_MESSAGE = keccak256("CROSS_CHAIN_SWAP");

    address public uniswapV2RouterAddress;
    address internal immutable wETH;
    address public zetaToken;

    IUniswapV2Router02 internal uniswapV2Router;

    event SentTokenSwap(
        address sourceTxOrigin,
        address sourceInputToken,
        uint256 inputTokenAmount,
        address destinationOutToken,
        uint256 outTokenMinAmount,
        address receiverAddress
    );

    event SentEthSwap(
        address sourceTxOrigin,
        uint256 inputEthAmount,
        address destinationOutToken,
        uint256 outTokenMinAmount,
        address receiverAddress
    );

    event Swapped(
        address sourceTxOrigin,
        address sourceInputToken,
        uint256 inputTokenAmount,
        address destinationOutToken,
        uint256 outTokenFinalAmount,
        address receiverAddress
    );

    event RevertedSwap(
        address sourceTxOrigin,
        address sourceInputToken,
        uint256 inputTokenAmount,
        uint256 inputTokenReturnedAmount
    );

    constructor(
        address _zetaConnector,
        address _zetaTokenInput,
        address _uniswapV2Router
    ) ZetaInteractor(_zetaConnector) {
        zetaToken = _zetaTokenInput;
        uniswapV2RouterAddress = _uniswapV2Router;
        uniswapV2Router = IUniswapV2Router02(_uniswapV2Router);
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
    ) external payable {
        if (!isValidChainId(destinationChainId)) revert InvalidDestinationChainId();

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
                0, /// @dev Output can't be validated here, it's validated after the next swap
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
    ) external {
        if (keccak256(interactorsByChainId[destinationChainId]) == keccak256(new bytes(0)))
            revert InvalidDestinationChainId();

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
                bool success1 = IERC20(sourceInputToken).transferFrom(msg.sender, address(this), inputTokenAmount);
                bool success2 = IERC20(sourceInputToken).approve(uniswapV2RouterAddress, inputTokenAmount);
                if (!success1 || !success2) revert ErrorTransferringTokens(sourceInputToken);
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
                0, /// @dev Output can't be validated here, it's validated after the next swap
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
            if (zetaMessage.zetaValueAndGas < outTokenMinAmount) revert InsufficientOutToken();

            bool success = IERC20(zetaToken).transfer(receiverAddress, zetaMessage.zetaValueAndGas);
            if (!success) revert ErrorTransferringTokens(zetaToken);

            outTokenFinalAmount = zetaMessage.zetaValueAndGas;
        } else {
            /**
             * @dev If the out token is not Zeta, get it using Uniswap
             */
            {
                bool success = IERC20(zetaToken).approve(uniswapV2RouterAddress, zetaMessage.zetaValueAndGas);
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
                    zetaMessage.zetaValueAndGas,
                    outTokenMinAmount,
                    path,
                    receiverAddress,
                    block.timestamp + MAX_DEADLINE
                );
            } else {
                amounts = uniswapV2Router.swapExactTokensForTokens(
                    zetaMessage.zetaValueAndGas,
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
            bool success1 = IERC20(zetaToken).approve(address(this), zetaRevert.zetaValueAndGas);
            bool success2 = IERC20(zetaToken).transferFrom(address(this), sourceTxOrigin, zetaRevert.zetaValueAndGas);
            if (!success1 || !success2) revert ErrorTransferringTokens(zetaToken);
            inputTokenReturnedAmount = zetaRevert.zetaValueAndGas;
        } else {
            /**
             * @dev If the source input token is not Zeta, trade it using Uniswap
             */
            {
                bool success = IERC20(zetaToken).approve(uniswapV2RouterAddress, zetaRevert.zetaValueAndGas);
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
                        zetaRevert.zetaValueAndGas,
                        0, /// @dev Any output is fine, otherwise the value will be stuck in the contract
                        path,
                        sourceTxOrigin,
                        block.timestamp + MAX_DEADLINE
                    );
                } else {
                    amounts = uniswapV2Router.swapExactTokensForTokens(
                        zetaRevert.zetaValueAndGas,
                        0, /// @dev Any output is fine, otherwise the value will be stuck in the contract
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
