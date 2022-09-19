// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract CrossChainLendingStorage is AccessControl {
    struct BorrowData {
        uint256 usdDebt;
        address collateralAsset;
        uint256 collateralAmount;
    }

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 internal constant _generalScale = 1000;
    uint256 internal constant _feePerScale = 10;
    uint256 internal constant _liquidationRatio = 900;
    uint256 internal constant _liquidationReward = 100;

    uint256 internal _zetaValueAndGas;
    uint256 internal _crossChaindestinationGasLimit;

    // https://docs.aave.com/risk/v/aave-v2/asset-risk/amm
    // loan to value table
    mapping(address => uint256) _riskTable;

    mapping(address => bool) _allowedTokens;

    mapping(address => mapping(address => uint256)) _deposits;
    mapping(address => mapping(address => uint256)) _depositsLocked;
    mapping(address => uint256) _treasureLocked;

    mapping(bytes32 => BorrowData) public _borrows;

    address _oracleAddress;

    address _feeWallet;

    constructor() {
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function setRiskTable(address token, uint256 risk) external onlyRole(ADMIN_ROLE) {
        _riskTable[token] = risk;
    }

    function setAllowedToken(address token, bool isAllow) external onlyRole(ADMIN_ROLE) {
        _allowedTokens[token] = isAllow;
    }

    function setFeeWallet(address feeWallet) external onlyRole(ADMIN_ROLE) {
        _feeWallet = feeWallet;
    }

    function setGasValues(uint256 zetaValueAndGas, uint256 crossChaindestinationGasLimit)
        external
        onlyRole(ADMIN_ROLE)
    {
        _zetaValueAndGas = zetaValueAndGas;
        _crossChaindestinationGasLimit = crossChaindestinationGasLimit;
    }
}
