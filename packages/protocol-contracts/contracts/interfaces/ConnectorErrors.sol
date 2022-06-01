// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

interface ConnectorErrors {
    error CallerIsNotTss(address caller);

    error CallerIsNotTssUpdater(address caller);

    error InvalidAddress();

    error ZetaTransferError();
}
