// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/interfaces/ZetaInterfaces.sol";

interface CrossChainCounterErrors {
    error InvalidMessageType();

    error DecrementOverflow();
}

contract CrossChainCounter is ZetaInteractor, ZetaReceiver, CrossChainCounterErrors {
    bytes32 public constant CROSS_CHAIN_INCREMENT_MESSAGE = keccak256("CROSS_CHAIN_INCREMENT");

    mapping(address => uint256) public counter;
    uint256 _crossChainId;

    constructor(address connectorAddress_) ZetaInteractor(connectorAddress_) {}

    function setCrossChainData(uint256 crossChainId, bytes calldata contractAddress) external onlyOwner {
        _crossChainId = crossChainId;
        interactorsByChainId[crossChainId] = contractAddress;
    }

    function crossChainCount() external {
        if (!_isValidChainId(_crossChainId)) revert InvalidDestinationChainId();

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: _crossChainId,
                destinationAddress: interactorsByChainId[_crossChainId],
                destinationGasLimit: 2500000,
                message: abi.encode(CROSS_CHAIN_INCREMENT_MESSAGE, msg.sender),
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
        (bytes32 messageType, address messageFrom) = abi.decode(zetaMessage.message, (bytes32, address));

        if (messageType != CROSS_CHAIN_INCREMENT_MESSAGE) revert InvalidMessageType();

        counter[messageFrom]++;
    }

    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata zetaRevert)
        external
        override
        isValidRevertCall(zetaRevert)
    {
        (bytes32 messageType, address messageFrom) = abi.decode(zetaRevert.message, (bytes32, address));

        if (messageType != CROSS_CHAIN_INCREMENT_MESSAGE) revert InvalidMessageType();
        if (counter[messageFrom] <= 0) revert DecrementOverflow();

        counter[messageFrom]--;
    }
}
