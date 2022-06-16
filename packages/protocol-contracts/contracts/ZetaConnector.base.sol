// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./interfaces/ConnectorErrors.sol";
import "./interfaces/ZetaInterfaces.sol";
import "./ZetaConnectorErrors.sol";

contract ZetaConnectorBase is ConnectorErrors, Pausable {
    address public zetaToken;

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

    event TSSAddressUpdated(address originSenderAddress, address newTSSAddress);

    constructor(
        address zetaTokenAddress,
        address tssAddress_,
        address tssAddressUpdater_
    ) {
        if (zetaTokenAddress == address(0) || tssAddress_ == address(0) || tssAddressUpdater_ == address(0)) {
            revert InvalidAddress();
        }

        zetaToken = zetaTokenAddress;
        tssAddress = tssAddress_;
        tssAddressUpdater = tssAddressUpdater_;
    }

    modifier onlyTssAddress() {
        if (msg.sender != tssAddress) revert CallerIsNotTss(msg.sender);
        _;
    }

    modifier onlyTssUpdater() {
        if (msg.sender != tssAddressUpdater) revert CallerIsNotTssUpdater(msg.sender);
        _;
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

    function pause() external onlyTssUpdater {
        _pause();
    }

    function unpause() external onlyTssUpdater {
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
