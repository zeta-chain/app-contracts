// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

/**
 * @dev Interface with most common / share custom errors
 */
interface ZetaErrors {
    // @dev: Error thrown when caller is not the address definied as TSS address
    error CallerIsNotTss(address caller);

    // @dev: Error thrown when caller is not the address definied as connector address
    error CallerIsNotConnector(address caller);

    // @dev: Error thrown when caller is not the address definied as TSS Updater address
    error CallerIsNotTssUpdater(address caller);

    // @dev: Error thrown when caller is not the address definied as TSS or TSS Updater address
    error CallerIsNotTssOrUpdater(address caller);

    // @dev: Error thrown when some contract receive an invalid address param, mostly zero address validation
    error InvalidAddress();

    // @dev: Error thrown when Zeta can't be transfer for some reason
    error ZetaTransferError();
}
