// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface OracleInterface {
    function tokenPerUsd(uint256 usdAmount, address token) external view returns (uint256);

    function usdPerToken(uint256 tokenAmount, address token) external view returns (uint256);
}
