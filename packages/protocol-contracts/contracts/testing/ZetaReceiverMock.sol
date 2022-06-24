// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../interfaces/ZetaInterfaces.sol";

contract ZetaReceiverMock is ZetaReceiver {
    event MockOnZetaMessage(address destinationAddress);

    event MockOnZetaRevert(address zetaTxSenderAddress);

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata zetaMessage) external override {
        emit MockOnZetaMessage(zetaMessage.destinationAddress);
    }

    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata zetaRevert) external override {
        emit MockOnZetaRevert(zetaRevert.zetaTxSenderAddress);
    }
}
