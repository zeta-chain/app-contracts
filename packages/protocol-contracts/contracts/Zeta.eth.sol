// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ZetaEth is ERC20("Zeta", "ZETA") {
    constructor(uint256 initialSupply) {
        _mint(msg.sender, initialSupply * (10**uint256(decimals())));
    }
}
