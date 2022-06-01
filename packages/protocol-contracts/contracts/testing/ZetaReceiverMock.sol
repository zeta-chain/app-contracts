// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../ZetaInterfaces.sol";

contract ZetaReceiverMock is ZetaReceiver {
    event MockOnZetaMessage(address destinationAddress);

    event MockOnZetaRevert(address originSenderAddress);

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata zetaMessage) external override {
        emit MockOnZetaMessage(zetaMessage.destinationAddress);
    }

    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata zetaRevert) external override {
        emit MockOnZetaRevert(zetaRevert.originSenderAddress);
    }
}
