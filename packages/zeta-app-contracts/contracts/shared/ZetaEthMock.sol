// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract ZetaEthMock is ERC20("Zeta", "ZETA") {
    constructor(address creator, uint256 initialSupply) {
        _mint(creator, initialSupply * (10 ** uint256(decimals())));
    }
}
