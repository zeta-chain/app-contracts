// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/interfaces/ZetaInterfaces.sol";

contract CrossChainCounter is Ownable, ZetaReceiver {
    bytes32 public constant CROSS_CHAIN_INCREMENT_MESSAGE = keccak256("CROSS_CHAIN_INCREMENT");

    address public connectorAddress;
    ZetaConnector internal connector;

    uint256 internal immutable currentChainId;
    uint256 internal _crossChainId;
    bytes internal _crossChainAddress;

    mapping(address => uint256) public counter;

    constructor(address connectorAddress_) {
        currentChainId = block.chainid;

        connectorAddress = connectorAddress_;
        connector = ZetaConnector(connectorAddress_);
    }

    function setCrossChainAddress(bytes calldata ccAddress) public onlyOwner {
        _crossChainAddress = ccAddress;
    }

    function setCrossChainId(uint256 ccId) public onlyOwner {
        _crossChainId = ccId;
    }

    function crossChainCount() external {
        require(_crossChainAddress.length != 0, "Cross-chain address is not set");
        require(_crossChainId != 0, "Cross-chain id is not set");

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: _crossChainId,
                destinationAddress: _crossChainAddress,
                destinationGasLimit: 2500000,
                message: abi.encode(CROSS_CHAIN_INCREMENT_MESSAGE, msg.sender),
                zetaValueAndGas: 0,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata zetaMessage) external override {
        require(msg.sender == connectorAddress, "This function can only be called by the Connector contract");
        require(
            keccak256(zetaMessage.zetaTxSenderAddress) == keccak256(_crossChainAddress),
            "Cross-chain address doesn't match"
        );
        require(zetaMessage.sourceChainId == _crossChainId, "Cross-chain id doesn't match");

        (bytes32 messageType, address messageFrom) = abi.decode(zetaMessage.message, (bytes32, address));

        require(messageType == CROSS_CHAIN_INCREMENT_MESSAGE, "Invalid message type");

        counter[messageFrom]++;
    }

    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata zetaRevert) external override {
        require(msg.sender == connectorAddress, "This function can only be called by the Connector contract");
        require(zetaRevert.zetaTxSenderAddress == address(this), "Invalid zetaTxSenderAddress");
        require(zetaRevert.sourceChainId == currentChainId, "Invalid sourceChainId");

        (bytes32 messageType, address messageFrom) = abi.decode(zetaRevert.message, (bytes32, address));

        require(messageType == CROSS_CHAIN_INCREMENT_MESSAGE, "Invalid message type");
        require(counter[messageFrom] > 0, "Decrement overflow");

        counter[messageFrom]--;
    }
}
