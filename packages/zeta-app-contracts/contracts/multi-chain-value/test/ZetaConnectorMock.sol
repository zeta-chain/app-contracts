// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";

contract ZetaConnectorMockValue is ZetaConnector {
    event Send(
        uint256 destinationChainId,
        bytes destinationAddress,
        uint256 destinationGasLimit,
        bytes message,
        uint256 zetaValueAndGas,
        bytes zetaParams
    );

    function send(ZetaInterfaces.SendInput calldata input) external override {
        emit Send(
            input.destinationChainId,
            input.destinationAddress,
            input.destinationGasLimit,
            input.message,
            input.zetaValueAndGas,
            input.zetaParams
        );
    }

    function onRevert(
        address zetaTxSenderAddress,
        uint256 sourceChainId,
        bytes calldata destinationAddress,
        uint256 destinationChainId,
        uint256 remainingZetaValue,
        bytes calldata message,
        bytes32 internalSendHash
    ) external {
        ZetaReceiver(zetaTxSenderAddress).onZetaRevert(
            ZetaInterfaces.ZetaRevert(
                zetaTxSenderAddress,
                sourceChainId,
                destinationAddress,
                destinationChainId,
                remainingZetaValue,
                message
            )
        );
    }
}
