// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../ZetaInteractor.sol";

contract ZetaInteractorMock is ZetaInteractor {
    constructor(address zetaConnectorAddress) ZetaInteractor(zetaConnectorAddress) {}

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata zetaMessage) external isValidMessageCall(zetaMessage) {}

    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata zetaRevert) external isValidRevertCall(zetaRevert) {}
}
