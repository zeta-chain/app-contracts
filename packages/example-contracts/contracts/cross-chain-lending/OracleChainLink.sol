// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./OracleInterface.sol";

interface OracleErrors {
    error InvalidAddress();

    error InvalidPair();
}

contract OracleChainLink is OracleInterface, OracleErrors {
    uint256 private constant CHAINLINK_DECIMALS = 8;
    mapping(address => mapping(address => address)) internal _aggregators;

    function setAggregator(
        address debtAsset,
        address collateralAsset,
        address aggregator
    ) external {
        if (debtAsset == address(0) || collateralAsset == address(0) || aggregator == address(0))
            revert InvalidAddress();
        _aggregators[debtAsset][collateralAsset] = aggregator;
    }

    function quote(
        address debtAsset,
        uint256 amount,
        address collateralAsset
    ) external view override returns (uint256) {
        address aggregatorAddress = _aggregators[debtAsset][collateralAsset];
        if (aggregatorAddress == address(0)) revert InvalidPair();

        (
            ,
            /*uint80 roundID*/
            int256 price, /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/
            ,
            ,

        ) = AggregatorV3Interface(aggregatorAddress).latestRoundData();

        return (amount * uint256(price)) / (10**CHAINLINK_DECIMALS);
    }
}
