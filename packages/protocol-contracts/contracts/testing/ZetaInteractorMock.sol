// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../ZetaInteractor.sol";

contract ZetaInteractorMock is ZetaInteractor {
    constructor(address zetaConnectorAddress) ZetaInteractor(zetaConnectorAddress) {}

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata zetaMessage) public isValidMessageCall(zetaMessage) {}

    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata zetaRevert) public isValidRevertCall(zetaRevert) {}
}
