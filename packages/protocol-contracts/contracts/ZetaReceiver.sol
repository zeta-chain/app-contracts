// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "./ZetaInterfaces.sol";

interface ZetaReceiver {
    /**
     * @dev onZetaMessage will be called when a cross-chain message is delivered to your contract
     */
    function onZetaMessage(ZetaInterfaces.ZetaMessage calldata zetaMessage) external;

    /**
     * @dev onZetaRevert will be called when a cross-chain message reverts
     * It's useful to rollback your contract's state
     */
    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata zetaRevert) external;
}
