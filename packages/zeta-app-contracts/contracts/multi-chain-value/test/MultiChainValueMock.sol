// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../MultiChainValue.sol";

contract MultiChainValueMock is MultiChainValue {
    constructor(address connectorAddress, address _zetaTokenInput) MultiChainValue(connectorAddress, _zetaTokenInput) {}
}
