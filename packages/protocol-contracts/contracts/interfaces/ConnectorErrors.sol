// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface ConnectorErrors {
    error CallerIsNotPauser(address caller);

    error CallerIsNotTss(address caller);

    error CallerIsNotTssUpdater(address caller);

    error CallerIsNotTssOrUpdater(address caller);

    error ZetaTransferError();

    error ExceedsMaxSupply(uint256 maxSupply);
}
