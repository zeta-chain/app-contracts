// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./interfaces/ConnectorErrors.sol";
import "./interfaces/ZetaInterfaces.sol";

/**
 * @dev Main abstraction of ZetaConnector.
 * This contract manages interactions between TSS and different chains.
 * There's an instance of this contract on each chain supported by ZetaChain.
 */
contract ZetaConnectorBase is ConnectorErrors, Pausable {
    address public immutable zetaToken;

    /**
     * @dev Multisig contract to pause incoming transactions.
     * The responsibility of pausing outgoing transactions is left to the protocol for more flexibility.
     */
    address public pauserAddress;

    /**
     * @dev Collectively held by ZetaChain validators.
     */
    address public tssAddress;

    /**
     * @dev This address will start pointing to a multisig contract, then it will become the TSS address itself.
     */
    address public tssAddressUpdater;

    event ZetaSent(
        address sourceTxOriginAddress,
        address indexed zetaTxSenderAddress,
        uint256 indexed destinationChainId,
        bytes destinationAddress,
        uint256 zetaValueAndGas,
        uint256 destinationGasLimit,
        bytes message,
        bytes zetaParams
    );

    event ZetaReceived(
        bytes zetaTxSenderAddress,
        uint256 indexed sourceChainId,
        address indexed destinationAddress,
        uint256 zetaValue,
        bytes message,
        bytes32 indexed internalSendHash
    );

    event ZetaReverted(
        address zetaTxSenderAddress,
        uint256 sourceChainId,
        uint256 indexed destinationChainId,
        bytes destinationAddress,
        uint256 remainingZetaValue,
        bytes message,
        bytes32 indexed internalSendHash
    );

    event TSSAddressUpdated(address zetaTxSenderAddress, address newTssAddress);

    event PauserAddressUpdated(address updaterAddress, address newTssAddress);

    /**
     * @dev Constructor requires initial addresses.
     * zetaToken address is the only immutable one, while others can be updated.
     */
    constructor(address zetaToken_, address tssAddress_, address tssAddressUpdater_, address pauserAddress_) {
        if (
            zetaToken_ == address(0) ||
            tssAddress_ == address(0) ||
            tssAddressUpdater_ == address(0) ||
            pauserAddress_ == address(0)
        ) {
            revert ZetaCommonErrors.InvalidAddress();
        }

        zetaToken = zetaToken_;
        tssAddress = tssAddress_;
        tssAddressUpdater = tssAddressUpdater_;
        pauserAddress = pauserAddress_;
    }

    /**
     * @dev Modifier to restrict actions to pauser address.
     */
    modifier onlyPauser() {
        if (msg.sender != pauserAddress) revert CallerIsNotPauser(msg.sender);
        _;
    }

    /**
     * @dev Modifier to restrict actions to TSS address.
     */
    modifier onlyTssAddress() {
        if (msg.sender != tssAddress) revert CallerIsNotTss(msg.sender);
        _;
    }

    /**
     * @dev Modifier to restrict actions to TSS updater address.
     */
    modifier onlyTssUpdater() {
        if (msg.sender != tssAddressUpdater) revert CallerIsNotTssUpdater(msg.sender);
        _;
    }

    /**
     * @dev Update the pauser address. The only address allowed to do that is the current pauser.
     */
    function updatePauserAddress(address pauserAddress_) external onlyPauser {
        if (pauserAddress_ == address(0)) revert ZetaCommonErrors.InvalidAddress();

        pauserAddress = pauserAddress_;

        emit PauserAddressUpdated(msg.sender, pauserAddress_);
    }

    /**
     * @dev Update the TSS address. The address can be updated by the TSS updater or the TSS address itself.
     */
    function updateTssAddress(address tssAddress_) external {
        if (msg.sender != tssAddress && msg.sender != tssAddressUpdater) revert CallerIsNotTssOrUpdater(msg.sender);
        if (tssAddress_ == address(0)) revert ZetaCommonErrors.InvalidAddress();

        tssAddress = tssAddress_;

        emit TSSAddressUpdated(msg.sender, tssAddress_);
    }

    /**
     * @dev Changes the ownership of tssAddressUpdater to be the one held by the ZetaChain TSS Signer nodes.
     */
    function renounceTssAddressUpdater() external onlyTssUpdater {
        if (tssAddress == address(0)) revert ZetaCommonErrors.InvalidAddress();

        tssAddressUpdater = tssAddress;
    }

    /**
     * @dev Pause the input (send) transactions.
     */

    function pause() external onlyPauser {
        _pause();
    }

    /**
     * @dev Unpause the contract to allow transactions again.
     */

    function unpause() external onlyPauser {
        _unpause();
    }

    /**
     * @dev Entrypoint to send data and value through ZetaChain.
     */
    function send(ZetaInterfaces.SendInput calldata input) external virtual {}

    /**
     * @dev Handler to receive data from other chain.
     * This method can be called only by TSS. Access validation is in implementation.
     */
    function onReceive(
        bytes calldata zetaTxSenderAddress,
        uint256 sourceChainId,
        address destinationAddress,
        uint256 zetaValue,
        bytes calldata message,
        bytes32 internalSendHash
    ) external virtual {}

    /**
     * @dev Handler to receive errors from other chain.
     * This method can be called only by TSS. Access validation is in implementation.
     */
    function onRevert(
        address zetaTxSenderAddress,
        uint256 sourceChainId,
        bytes calldata destinationAddress,
        uint256 destinationChainId,
        uint256 remainingZetaValue,
        bytes calldata message,
        bytes32 internalSendHash
    ) external virtual {}
}
