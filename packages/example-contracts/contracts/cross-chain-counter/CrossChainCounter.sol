// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/ZetaInterfaces.sol";
import "@zetachain/protocol-contracts/contracts/ZetaReceiver.sol";

contract CrossChainCounter is ZetaInteractor, ZetaReceiver {
    bytes32 public constant CROSS_CHAIN_INCREMENT_MESSAGE = keccak256("CROSS_CHAIN_INCREMENT");

    uint256 internal _crossChainId;
    mapping(address => uint256) public counter;

    constructor(address connectorAddress_) ZetaInteractor(connectorAddress_) {}

    function setCrossChainId(uint256 ccId) public onlyOwner {
        _crossChainId = ccId;
    }

    function crossChainCount() external {
        require(_crossChainId != 0, "Cross-chain id is not set");
        require(interactorsByChainId[_crossChainId].length != 0, "Cross-chain address is not set");

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: _crossChainId,
                destinationAddress: interactorsByChainId[_crossChainId],
                gasLimit: 2500000,
                message: abi.encode(CROSS_CHAIN_INCREMENT_MESSAGE, msg.sender),
                zetaAmount: 0,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata zetaMessage) external isValidMessageCall(zetaMessage) {
        require(zetaMessage.originChainId == _crossChainId, "Cross-chain id doesn't match");

        (bytes32 messageType, address messageFrom) = abi.decode(zetaMessage.message, (bytes32, address));

        require(messageType == CROSS_CHAIN_INCREMENT_MESSAGE, "Invalid message type");

        counter[messageFrom]++;
    }

    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata zetaRevert) external isValidRevertCall(zetaRevert) {
        (bytes32 messageType, address messageFrom) = abi.decode(zetaRevert.message, (bytes32, address));

        require(messageType == CROSS_CHAIN_INCREMENT_MESSAGE, "Invalid message type");
        require(counter[messageFrom] > 0, "Decrement overflow");

        counter[messageFrom]--;
    }
}
