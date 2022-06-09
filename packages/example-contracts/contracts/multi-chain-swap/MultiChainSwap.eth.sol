// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@zetachain/protocol-contracts/contracts/ZetaInterfaces.sol";

import "./MultiChainSwap.base.sol";

abstract contract MultiChainSwapEth is MultiChainSwapBase {
    address public connectorAddress;
    ZetaConnector internal _zetaConnector;

    constructor(address _connectorAddress) {
        connectorAddress = _connectorAddress;
        _zetaConnector = ZetaConnector(_connectorAddress);
    }
}
