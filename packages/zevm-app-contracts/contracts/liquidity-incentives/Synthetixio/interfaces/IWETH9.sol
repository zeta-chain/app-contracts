// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface IWETH9 {
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);
    event Deposit(address indexed dst, uint wad);
    event Withdrawal(address indexed src, uint wad);

    function totalSupply() external view returns (uint);

    function balanceOf(address owner) external view returns (uint);

    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint wad) external returns (bool);

    function transfer(address to, uint wad) external returns (bool);

    function transferFrom(address from, address to, uint wad) external returns (bool);

    function deposit() external payable;

    function withdraw(uint wad) external;
}
