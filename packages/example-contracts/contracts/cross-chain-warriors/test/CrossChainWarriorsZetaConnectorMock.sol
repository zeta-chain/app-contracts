// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/interfaces/ZetaInterfaces.sol";

import "../CrossChainWarriors.sol";

contract CrossChainWarriorsZetaConnectorMock is ZetaConnector {
    function callOnZetaMessage(
        bytes memory zetaTxSenderAddress,
        uint256 sourceChainId,
        address destinationAddress,
        uint256 zetaValueAndGas,
        bytes calldata message
    ) public {
        return
            CrossChainWarriors(destinationAddress).onZetaMessage(
                ZetaInterfaces.ZetaMessage({
                    zetaTxSenderAddress: zetaTxSenderAddress,
                    sourceChainId: sourceChainId,
                    destinationAddress: destinationAddress,
                    zetaValueAndGas: zetaValueAndGas,
                    message: message
                })
            );
    }

    function callOnZetaRevert(
        address zetaTxSenderAddress,
        uint256 sourceChainId,
        uint256 destinationChainId,
        bytes calldata destinationAddress,
        uint256 zetaValueAndGas,
        uint256, // destinationGasLimit
        bytes calldata message
    ) public {
        return
            CrossChainWarriors(zetaTxSenderAddress).onZetaRevert(
                ZetaInterfaces.ZetaRevert({
                    zetaTxSenderAddress: zetaTxSenderAddress,
                    sourceChainId: sourceChainId,
                    destinationAddress: destinationAddress,
                    destinationChainId: destinationChainId,
                    zetaValueAndGas: zetaValueAndGas,
                    message: message
                })
            );
    }

    function send(ZetaInterfaces.SendInput calldata sendInput) external override {
        uint256 sourceChainId = sendInput.destinationChainId == 2 ? 1 : 2;
        address dest = address(uint160(bytes20(sendInput.destinationAddress)));

        return
            callOnZetaMessage(
                abi.encodePacked(msg.sender),
                sourceChainId,
                dest,
                sendInput.zetaValueAndGas,
                sendInput.message
            );
    }
}
