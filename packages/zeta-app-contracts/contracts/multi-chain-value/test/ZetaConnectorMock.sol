// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";

contract ZetaConnectorMockValue is ZetaConnector {
    function send(ZetaInterfaces.SendInput calldata input) external override {}
}
