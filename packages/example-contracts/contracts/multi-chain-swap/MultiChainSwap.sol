// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/ZetaInteractor.sol";

interface MultiChainSwap is ZetaReceiver {
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
    ) external payable;

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
    ) external;
}
