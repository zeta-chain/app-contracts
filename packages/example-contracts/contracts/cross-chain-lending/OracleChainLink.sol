// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./OracleInterface.sol";

interface OracleErrors {
    error InvalidAddress();

    error InvalidPair();
}

contract OracleChainLink is OracleInterface, OracleErrors {
    mapping(address => address) internal _aggregators;

    function setAggregator(address tokenAddress, address aggregator) external {
        if (tokenAddress == address(0) || aggregator == address(0)) revert InvalidAddress();
        _aggregators[tokenAddress] = aggregator;
    }

    function tokenPerUsd(uint256 usdAmount, address token) external view override returns (uint256) {
        address aggregator = _aggregators[token];
        if (aggregator == address(0)) revert InvalidPair();

        (
            ,
            /*uint80 roundID*/
            int256 price, /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/
            ,
            ,

        ) = AggregatorV3Interface(aggregator).latestRoundData();

        uint256 decimals = ERC20(token).decimals();

        return (usdAmount * 10**decimals) / uint256(price);
    }

    function usdPerToken(uint256 tokenAmount, address token) external view override returns (uint256) {
        address aggregator = _aggregators[token];
        if (aggregator == address(0)) revert InvalidPair();

        (
            ,
            /*uint80 roundID*/
            int256 price, /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/
            ,
            ,

        ) = AggregatorV3Interface(aggregator).latestRoundData();

        uint256 decimals = ERC20(token).decimals();

        return (tokenAmount * uint256(price)) / 10**decimals;
    }
}
