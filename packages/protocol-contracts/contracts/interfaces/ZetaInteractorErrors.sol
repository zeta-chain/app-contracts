// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

/**
 * @dev Interface with Zeta Interactor errors
 */
interface ZetaInteractorErrors {
    // @dev: Error thrown when try to send a message or tokens to a non whitelisted chain
    error InvalidDestinationChainId();

    // @dev: Error thrown when caller is invalid. Ex: if onZetaMessage or onZetaRevert are not called by connector
    error InvalidCaller(address caller);

    // @dev: Error thrown when message on onZetaMessage has the wrong format
    error InvalidZetaMessageCall();

    // @dev: Error thrown when message on onZetaRevert has the wrong format
    error InvalidZetaRevertCall();
}
