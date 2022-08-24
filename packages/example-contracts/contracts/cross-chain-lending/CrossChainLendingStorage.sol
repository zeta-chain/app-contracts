// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract CrossChainLendingStorage {
    /// dev: valid tokens to be use as collateral
    address[] _validTokens;
    // https://docs.aave.com/risk/v/aave-v2/asset-risk/amm
    // loan to value table
    mapping(address => uint256) _riskTable;

    mapping(address => bool) _allowedTokens;

    mapping(address => mapping(address => uint256)) _deposits;
    mapping(address => mapping(address => uint256)) _depositsLocked;

    address _oracleAddress;
}
