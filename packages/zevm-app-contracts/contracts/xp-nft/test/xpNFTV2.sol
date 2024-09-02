// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../xpNFT.sol";

contract ZetaXPV2 is ZetaXP {
    function version() public pure override returns (string memory) {
        return "2.0.0";
    }
}
