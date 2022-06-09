// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../ZetaReceiver.sol";

contract ZetaReceiverMock is ZetaReceiver {
    event MockOnZetaMessage(address destinationAddress);

    event MockOnZetaRevert(address originSenderAddress);

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata _zetaMessage) external override {
        emit MockOnZetaMessage(_zetaMessage.destinationAddress);
    }

    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata _zetaRevert) external override {
        emit MockOnZetaRevert(_zetaRevert.originSenderAddress);
    }
}
