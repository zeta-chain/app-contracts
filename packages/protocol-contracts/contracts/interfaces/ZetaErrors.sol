// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface ZetaErrors {
    error CallerIsNotTss(address caller);

    error CallerIsNotTssOrConnector(address caller);

    error CallerIsNotTssUpdater(address caller);

    error InvalidAddress();

    error ZetaTransferError();
}
