// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface MultiChainSwapErrors {
    error ErrorTransferringTokens(address token);

    error ErrorApprovingTokens(address token);

    error ErrorSwappingTokens();

    error ValueShouldBeGreaterThanZero();

    error OutTokenInvariant();

    error InsufficientOutToken();

    error MissingOriginInputTokenAddress();

    error InvalidMessageType();
}
