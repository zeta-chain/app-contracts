// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@zetachain/protocol-contracts/contracts/ZetaInterfaces.sol";

import "../CrossChainCounter.sol";

contract CounterZetaConnectorMock is ZetaConnector {
    function callOnZetaMessage(
        bytes memory originSenderAddress,
        uint256 originChainId,
        address destinationAddress,
        uint256 zetaAmount,
        bytes calldata message
    ) public {
        return
            CrossChainCounter(destinationAddress).onZetaMessage(
                ZetaInterfaces.ZetaMessage({
                    originSenderAddress: originSenderAddress,
                    originChainId: originChainId,
                    destinationAddress: destinationAddress,
                    zetaAmount: zetaAmount,
                    message: message
                })
            );
    }

    function callOnZetaRevert(
        address originSenderAddress,
        uint256 originChainId,
        uint256 destinationChainId,
        bytes calldata destinationAddress,
        uint256 zetaAmount,
        uint256, // gasLimit
        bytes calldata message
    ) public {
        return
            CrossChainCounter(originSenderAddress).onZetaRevert(
                ZetaInterfaces.ZetaRevert({
                    originSenderAddress: originSenderAddress,
                    originChainId: originChainId,
                    destinationAddress: destinationAddress,
                    destinationChainId: destinationChainId,
                    zetaAmount: zetaAmount,
                    message: message
                })
            );
    }

    function send(ZetaInterfaces.SendInput calldata sendInput) external {
        uint256 originChainId = sendInput.destinationChainId == 2 ? 1 : 2;
        address dest = address(uint160(bytes20(sendInput.destinationAddress)));

        return
            callOnZetaMessage(
                abi.encodePacked(msg.sender),
                originChainId,
                dest,
                sendInput.zetaAmount,
                sendInput.message
            );
    }
}
