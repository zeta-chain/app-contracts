// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

/**
 * @dev Interface with connector custom errors
 */
interface ConnectorErrors {
    // @dev Thrown when caller is not the address defined as paused address
    error CallerIsNotPauser(address caller);

    // @dev Thrown when caller is not the address defined as TSS address
    error CallerIsNotTss(address caller);

    // @dev Thrown when caller is not the address defined as TSS Updater address
    error CallerIsNotTssUpdater(address caller);

    // @dev Thrown when caller is not the address defined as TSS or TSS Updater address
    error CallerIsNotTssOrUpdater(address caller);

    // @dev Thrown when Zeta can't be transferred for some reason
    error ZetaTransferError();

    // @dev Thrown when maxSupply will be exceed if minting will proceed
    error ExceedsMaxSupply(uint256 maxSupply);
}
