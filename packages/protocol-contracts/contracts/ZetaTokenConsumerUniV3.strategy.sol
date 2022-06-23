// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./interfaces/ZetaInterfaces.sol";

interface ZetaTokenConsumerUniV3Errors {
    error ErrorSwappingTokens();
}

/**
 * @dev Uniswap V3 strategy for ZetaTokenConsumer
 */
contract ZetaTokenConsumerUniV3 is ZetaTokenConsumer, ZetaTokenConsumerUniV3Errors {
    function getZetaFromEth(uint256 minAmount) external payable override {
        //
    }

    function getZetaFromToken(uint256 minAmount) external override {
        //
    }

    function getEthFromZeta(uint256 minAmount) external payable override {
        //
    }

    function getTokenFromZeta(uint256 minAmount) external override {
        //
    }
}
