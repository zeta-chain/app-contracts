// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract CrossChainLendingStorage is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // https://docs.aave.com/risk/v/aave-v2/asset-risk/amm
    // loan to value table
    mapping(address => uint256) _riskTable;

    mapping(address => bool) _allowedTokens;

    mapping(address => mapping(address => uint256)) _deposits;
    mapping(address => mapping(address => uint256)) _depositsLocked;

    address _oracleAddress;

    constructor() {
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function setRiskTable(address token, uint256 risk) external onlyRole(ADMIN_ROLE) {
        _riskTable[token] = risk;
    }

    function setAllowedToken(address token, bool isAllow) external onlyRole(ADMIN_ROLE) {
        _allowedTokens[token] = isAllow;
    }
}
