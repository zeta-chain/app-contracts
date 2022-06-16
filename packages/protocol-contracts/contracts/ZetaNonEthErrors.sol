// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface ZetaNonEthErrors {
    error AddressCantBeZero();
    error InvalidCaller(address tss, address caller);
    error InvalidMinter(address caller);
}
