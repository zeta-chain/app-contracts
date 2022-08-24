// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface OracleInterface {
    function quote(
        address debtAsset,
        uint256 amount,
        address collateralAsset
    ) external view returns (uint256);
}
