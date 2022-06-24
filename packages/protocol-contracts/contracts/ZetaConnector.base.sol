// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./interfaces/ConnectorErrors.sol";
import "./interfaces/ZetaInterfaces.sol";

contract ZetaConnectorBase is ConnectorErrors, Pausable {
    address public zetaToken;

    address public pauserAddress;

    /**
     * @dev Collectively held by Zeta blockchain validators.
     */
    address public tssAddress;

    address public tssAddressUpdater;

    event ZetaSent(
        address indexed originSenderAddress,
        uint256 destinationChainId,
        bytes destinationAddress,
        uint256 zetaAmount,
        uint256 gasLimit,
        bytes message,
        bytes zetaParams
    );

    event ZetaReceived(
        bytes originSenderAddress,
        uint256 indexed originChainId,
        address indexed destinationAddress,
        uint256 zetaAmount,
        bytes message,
        bytes32 indexed internalSendHash
    );

    event ZetaReverted(
        address originSenderAddress,
        uint256 originChainId,
        uint256 indexed destinationChainId,
        bytes indexed destinationAddress,
        uint256 zetaAmount,
        bytes message,
        bytes32 indexed internalSendHash
    );

    event TSSAddressUpdated(address updaterAddress, address newTssAddress);

    event PauserAddressUpdated(address updaterAddress, address newTssAddress);

    constructor(
        address zetaToken_,
        address tssAddress_,
        address tssAddressUpdater_,
        address pauserAddress_
    ) {
        if (zetaToken_ == address(0) || tssAddress_ == address(0) || tssAddressUpdater_ == address(0)) {
            revert InvalidAddress();
        }

        zetaToken = zetaToken_;
        tssAddress = tssAddress_;
        tssAddressUpdater = tssAddressUpdater_;
        pauserAddress = pauserAddress_;
    }

    modifier onlyPauser() {
        if (msg.sender != pauserAddress) revert CallerIsNotPauser(msg.sender);
        _;
    }

    modifier onlyTssAddress() {
        if (msg.sender != tssAddress) revert CallerIsNotTss(msg.sender);
        _;
    }

    modifier onlyTssUpdater() {
        if (msg.sender != tssAddressUpdater) revert CallerIsNotTssUpdater(msg.sender);
        _;
    }

    function updatePauserAddress(address pauserAddress_) external onlyPauser {
        if (pauserAddress_ == address(0)) revert InvalidAddress();

        pauserAddress = pauserAddress_;

        emit PauserAddressUpdated(msg.sender, pauserAddress_);
    }

    function updateTssAddress(address tssAddress_) external onlyTssUpdater {
        if (tssAddress_ == address(0)) revert InvalidAddress();

        tssAddress = tssAddress_;

        emit TSSAddressUpdated(msg.sender, tssAddress_);
    }

    /**
     * @dev Changes the ownership of tssAddressUpdater to be the one held by the Zeta blockchain TSS nodes.
     */
    function renounceTssAddressUpdater() external onlyTssUpdater {
        if (tssAddress == address(0)) revert InvalidAddress();

        tssAddressUpdater = tssAddress;
    }

    function pause() external onlyPauser {
        _pause();
    }

    function unpause() external onlyPauser {
        _unpause();
    }

    function send(ZetaInterfaces.SendInput calldata input) external virtual {}

    function onReceive(
        bytes calldata originSenderAddress,
        uint256 originChainId,
        address destinationAddress,
        uint256 zetaAmount,
        bytes calldata message,
        bytes32 internalSendHash
    ) external virtual {}

    function onRevert(
        address originSenderAddress,
        uint256 originChainId,
        bytes calldata destinationAddress,
        uint256 destinationChainId,
        uint256 zetaAmount,
        bytes calldata message,
        bytes32 internalSendHash
    ) external virtual {}
}
