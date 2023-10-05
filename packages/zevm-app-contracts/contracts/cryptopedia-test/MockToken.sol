// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract MockZETA is ERC20 {
    constructor(
        address creator,
        uint256 initialSupply,
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {
        _mint(creator, initialSupply * (10 ** uint256(decimals())));
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public {
        _burn(from, amount);
    }
}
