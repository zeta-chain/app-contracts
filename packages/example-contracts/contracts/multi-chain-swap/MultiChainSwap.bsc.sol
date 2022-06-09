// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@zetachain/protocol-contracts/contracts/ZetaInterfaces.sol";
import "@zetachain/protocol-contracts/contracts/ZetaReceiver.sol";

abstract contract MultiChainSwapBsc is ZetaReceiver {
    address public connectorAddress;
    ZetaConnector internal _zetaConnector;

    constructor(address _connectorAddress) {
        connectorAddress = _connectorAddress;
        _zetaConnector = ZetaConnector(_connectorAddress);
    }
}
