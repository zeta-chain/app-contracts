// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface ZetaErrors {
    error CallerIsNotTss(address caller);

    error CallerIsNotConnector(address caller);

    error CallerIsNotTssUpdater(address caller);

    error CallerIsNotTssOrUpdater(address caller);

    error InvalidAddress();

    error ZetaTransferError();
}
