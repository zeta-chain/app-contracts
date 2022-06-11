// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/ZetaInterfaces.sol";
import "@zetachain/protocol-contracts/contracts/ZetaReceiver.sol";

/**
 * @dev A simple contract able to send and receive Hello World messages from other chains.
 * Emits a HelloWorldEvent on successful messages
 * Emits a RevertedHelloWorldEvent on failed messages
 */
contract CrossChainMessage is Ownable {
    bytes32 public constant HELLO_WORLD_MESSAGE_TYPE = keccak256("CROSS_CHAIN_HELLO_WORLD");

    event HelloWorldEvent(string messageData);
    event RevertedHelloWorldEvent(string messageData);

    address internal _zetaConnectorAddress;
    ZetaConnector internal _zeta;

    uint256 internal immutable _currentChainId;
    bytes internal _crossChainAddress;
    uint256 internal _crossChainId;

    constructor(address _zetaConnectorInputAddress) {
        _currentChainId = block.chainid;

        _zetaConnectorAddress = _zetaConnectorInputAddress;
        _zeta = ZetaConnector(_zetaConnectorInputAddress);
    }

    /**
     * @dev The cross-chain address cannot be set on the constructor since it depends on the deployment of the contract on the other chain.
     */
    function setCrossChainAddress(bytes calldata _ccAddress) public onlyOwner {
        _crossChainAddress = _ccAddress;
    }

    /**
     * @dev Can be set on the constructor, but we favor this pattern for more flexibility.
     */
    function setCrossChainID(uint256 _ccId) public onlyOwner {
        _crossChainId = _ccId;
    }

    function sendHelloWorld() external {
        require(_crossChainAddress.length != 0, "Cross-chain address is not set");
        require(_crossChainId != 0, "Cross-chain ID is not set");

        _zeta.send(
            ZetaInterfaces.SendInput({
                destinationChainId: _crossChainId,
                destinationAddress: _crossChainAddress,
                gasLimit: 2500000,
                message: abi.encode(HELLO_WORLD_MESSAGE_TYPE, "Hello, Cross-Chain World!"),
                zetaAmount: 0,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata _zetaMessage) external {
        require(msg.sender == _zetaConnectorAddress, "This function can only be called by the Zeta Connector contract");
        require(
            keccak256(_zetaMessage.originSenderAddress) == keccak256(_crossChainAddress),
            "Cross-chain address doesn't match"
        );
        require(_zetaMessage.originChainId == _crossChainId, "Cross-chain id doesn't match");

        /**
         * @dev Decode should follow the signature of the message provided to zeta.send.
         */
        (bytes32 messageType, string memory helloWorldMessage) = abi.decode(_zetaMessage.message, (bytes32, string));

        /**
         * @dev Setting a message type is a useful pattern to distinguish between different messages.
         */
        require(messageType == HELLO_WORLD_MESSAGE_TYPE, "Invalid message type");

        emit HelloWorldEvent(helloWorldMessage);
    }

    /**
     * @dev Called by the Zeta Connector contract when the message fails to be sent.
     * Useful to cleanup and leave the application on its initial state.
     * Note that the require statements and the functionality are similar to onZetaMessage.
     */
    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata _zetaRevert) external {
        require(msg.sender == _zetaConnectorAddress, "This function can only be called by the Zeta Connector contract");
        require(_zetaRevert.originSenderAddress == address(this), "Invalid originSenderAddress");
        require(_zetaRevert.originChainId == _currentChainId, "Invalid originChainId");

        (bytes32 messageType, string memory helloWorldMessage) = abi.decode(_zetaRevert.message, (bytes32, string));

        require(messageType == HELLO_WORLD_MESSAGE_TYPE, "Invalid message type");

        emit RevertedHelloWorldEvent(helloWorldMessage);
    }
}
