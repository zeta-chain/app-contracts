// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";

interface CrossChainCounterErrors {
    error InvalidMessageType();

    error DecrementOverflow();
}

contract CrossChainCounter is ZetaInteractor, ZetaReceiver, CrossChainCounterErrors {
    bytes32 public constant CROSS_CHAIN_INCREMENT_MESSAGE = keccak256("CROSS_CHAIN_INCREMENT");

    mapping(address => uint256) public counter;

    constructor(address connectorAddress_) ZetaInteractor(connectorAddress_) {}

    function crossChainCount(uint256 destinationChainId) external {
        if (!_isValidChainId(destinationChainId)) revert InvalidDestinationChainId();

        counter[msg.sender]++;
        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: interactorsByChainId[destinationChainId],
                destinationGasLimit: 2500000,
                message: abi.encode(CROSS_CHAIN_INCREMENT_MESSAGE, msg.sender),
                zetaValueAndGas: 0,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessage(
        ZetaInterfaces.ZetaMessage calldata zetaMessage
    ) external override isValidMessageCall(zetaMessage) {
        (bytes32 messageType, address messageFrom) = abi.decode(zetaMessage.message, (bytes32, address));

        if (messageType != CROSS_CHAIN_INCREMENT_MESSAGE) revert InvalidMessageType();

        counter[messageFrom]++;
    }

    function onZetaRevert(
        ZetaInterfaces.ZetaRevert calldata zetaRevert
    ) external override isValidRevertCall(zetaRevert) {
        (bytes32 messageType, address messageFrom) = abi.decode(zetaRevert.message, (bytes32, address));

        if (messageType != CROSS_CHAIN_INCREMENT_MESSAGE) revert InvalidMessageType();
        if (counter[messageFrom] <= 0) revert DecrementOverflow();

        counter[messageFrom]--;
    }
}
