// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./OracleInterface.sol";

contract StableCoinAggregator is AggregatorV3Interface {
    uint8 private _decimals;
    int256 private _price;

    constructor(uint8 decimals_, int256 price) {
        _decimals = decimals_;
        _price = price;
    }

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (0, _price, 0, 0, 0);
    }

    function description() external view override returns (string memory) {}

    function version() external view override returns (uint256) {
        return 1;
    }

    function getRoundData(uint80 _roundId)
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (0, 0, 0, 0, 0);
    }
}
