// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../openzeppelin/Ownable2Step.sol";
import "../ZetaInteractor.sol";

contract ZetaInteractorMock is Ownable2Step, ZetaInteractor, ZetaReceiver {
    constructor(address zetaConnectorAddress) ZetaInteractor(zetaConnectorAddress) {}

    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata zetaMessage)
        external
        override
        isValidMessageCall(zetaMessage)
    {}

    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata zetaRevert)
        external
        override
        isValidRevertCall(zetaRevert)
    {}
}
