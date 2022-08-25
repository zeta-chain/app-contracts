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

    function quote(
        address debtAsset,
        uint256 amount,
        address collateralAsset
    ) external view override returns (uint256) {
        address debtAggregator = _aggregators[debtAsset];
        if (debtAggregator == address(0)) revert InvalidPair();

        (
            ,
            /*uint80 roundID*/
            int256 debtPrice, /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/
            ,
            ,

        ) = AggregatorV3Interface(debtAggregator).latestRoundData();

        address collateralAggregator = _aggregators[collateralAsset];
        if (collateralAggregator == address(0)) revert InvalidPair();

        (
            ,
            /*uint80 roundID*/
            int256 collateralPrice, /*uint startedAt*/ /*uint timeStamp*/ /*uint80 answeredInRound*/
            ,
            ,

        ) = AggregatorV3Interface(collateralAggregator).latestRoundData();

        uint256 debtDecimals = ERC20(debtAsset).decimals();
        uint256 collateralDecimals = ERC20(collateralAsset).decimals();
        uint256 ret = (amount * uint256(debtPrice)) / uint256(collateralPrice);
        if (debtDecimals > collateralDecimals) return ret / 10**(debtDecimals - collateralDecimals);

        return ret;
    }
}
