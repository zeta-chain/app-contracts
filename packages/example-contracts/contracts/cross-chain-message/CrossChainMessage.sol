// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/interfaces/ZetaInterfaces.sol";

interface CrossChainMessageErrors {
    error InvalidMessageType();
}

/**
 * @dev A simple contract able to send and receive Hello World messages from other chains.
 * Emits a HelloWorldEvent on successful messages
 * Emits a RevertedHelloWorldEvent on failed messages
 */
contract CrossChainMessage is ZetaInteractor, ZetaReceiver, CrossChainMessageErrors {
    bytes32 public constant HELLO_WORLD_MESSAGE_TYPE = keccak256("CROSS_CHAIN_HELLO_WORLD");

    event HelloWorldEvent(string messageData);
    event RevertedHelloWorldEvent(string messageData);

    constructor(address connectorAddress_) ZetaInteractor(connectorAddress_) {}

    function sendHelloWorld(uint256 crossChainId) external {
        if (!_isValidChainId(crossChainId)) revert InvalidDestinationChainId();

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: crossChainId,
                destinationAddress: interactorsByChainId[crossChainId],
                destinationGasLimit: 2500000,
                message: abi.encode(HELLO_WORLD_MESSAGE_TYPE, "Hello, Cross-Chain World!"),
                zetaValueAndGas: 0,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata zetaMessage)
        external
        override
        isValidMessageCall(zetaMessage)
    {
        /**
         * @dev Decode should follow the signature of the message provided to zeta.send.
         */
        (bytes32 messageType, string memory helloWorldMessage) = abi.decode(zetaMessage.message, (bytes32, string));

        /**
         * @dev Setting a message type is a useful pattern to distinguish between different messages.
         */
        if (messageType != HELLO_WORLD_MESSAGE_TYPE) revert InvalidMessageType();

        emit HelloWorldEvent(helloWorldMessage);
    }

    /**
     * @dev Called by the Zeta Connector contract when the message fails to be sent.
     * Useful to cleanup and leave the application on its initial state.
     * Note that the require statements and the functionality are similar to onZetaMessage.
     */
    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata zetaRevert)
        external
        override
        isValidRevertCall(zetaRevert)
    {
        (bytes32 messageType, string memory helloWorldMessage) = abi.decode(zetaRevert.message, (bytes32, string));

        if (messageType != HELLO_WORLD_MESSAGE_TYPE) revert InvalidMessageType();

        emit RevertedHelloWorldEvent(helloWorldMessage);
    }
}
