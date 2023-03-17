// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

/**
 * @dev Interface with connector custom errors
 */
interface ConnectorErrors {
    // @dev: Error thrown when caller is not the address definied as paused address
    error CallerIsNotPauser(address caller);

    // @dev: Error thrown when caller is not the address definied as TSS address
    error CallerIsNotTss(address caller);

    // @dev: Error thrown when caller is not the address definied as TSS Updater address
    error CallerIsNotTssUpdater(address caller);

    // @dev: Error thrown when caller is not the address definied as TSS or TSS Updater address
    error CallerIsNotTssOrUpdater(address caller);

    // @dev: Error thrown when Zeta can't be transfer for some reason
    error ZetaTransferError();

    // @dev: Error thrown when maxSupply will be exceed if minting will proceed
    error ExceedsMaxSupply(uint256 maxSupply);
}
