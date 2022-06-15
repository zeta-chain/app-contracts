// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./ZetaReceiver.sol";
import "./ZetaInterfaces.sol";
import "./ZetaConnectorErrors.sol";

contract ZetaConnectorBase is Pausable, ZetaConnectorErrors {
    address public zetaToken;

    /**
     * @dev Collectively hold by Zeta blockchain validators.
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
        address zetaTokenAddress_,
        address tssAddress_,
        address tssAddressUpdater_
    ) {
        if (zetaTokenAddress_ == address(0) || tssAddress_ == address(0) || tssAddressUpdater_ == address(0))
            revert AddressCantBeZero();
        zetaToken = zetaTokenAddress_;
        tssAddress = tssAddress_;
        tssAddressUpdater = tssAddressUpdater_;
    }

    modifier onlyTssAddress() {
        require(msg.sender == tssAddress, "ZetaConnector: only TSS address can call this function");
        _;
    }

    modifier onlyTssUpdater() {
        require(msg.sender == tssAddressUpdater, "ZetaConnector: only TSS updater can call this function");
        _;
    }

    // update the TSS Address in case of Zeta blockchain validator nodes churn
    function updateTssAddress(address tssAddress_) external onlyTssUpdater {
        require(tssAddress_ != address(0), "ZetaConnector: invalid tssAddress");

        tssAddress = tssAddress_;
        emit TSSAddressUpdated(msg.sender, tssAddress_);
    }

    // Change the ownership of tssAddressUpdater to the Zeta blockchain TSS nodes.
    // Effectively, only Zeta blockchain validators collectively can update TSS Address afterwards.
    function renounceTssAddressUpdater() external onlyTssUpdater {
        require(tssAddress != address(0), "ZetaConnector: invalid tssAddress");

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
