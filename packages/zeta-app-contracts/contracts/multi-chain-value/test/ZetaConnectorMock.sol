// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";

contract ZetaConnectorMockValue is ZetaConnector {
    function send(ZetaInterfaces.SendInput calldata input) external override {}

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
