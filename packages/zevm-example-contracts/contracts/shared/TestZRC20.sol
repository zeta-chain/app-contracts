// SPDX-License-Identifier: MIT
pragma solidity =0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./BytesHelperLib.sol";

contract TestZRC20 is ERC20 {
    constructor(uint256 initialSupply, string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply * (10 ** uint256(decimals())));
    }

    function deposit(address to, uint256 amount) external returns (bool) {
        return true;
    }

    function bytesToAddress(bytes calldata data, uint256 offset, uint256 size) public pure returns (address output) {
        bytes memory b = data[offset:offset + size];
        assembly {
            output := mload(add(b, size))
        }
    }

    function withdraw(bytes calldata to, uint256 amount) external returns (bool) {
        address toAddress = BytesHelperLib.bytesToAddress(to, 12);
        return transfer(toAddress, amount);
    }

    function withdrawGasFee() external view returns (address, uint256) {
        return (address(this), 0);
    }
}
