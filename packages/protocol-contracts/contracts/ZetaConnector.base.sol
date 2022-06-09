// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./ZetaReceiver.sol";
import "./ZetaInterfaces.sol";

contract ZetaConnectorBase is Pausable {
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

    constructor(
        address _zetaTokenAddress,
        address _tssAddress,
        address _tssAddressUpdater
    ) {
        zetaToken = _zetaTokenAddress;
        tssAddress = _tssAddress;
        tssAddressUpdater = _tssAddressUpdater;
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
    function updateTssAddress(address _tssAddress) external onlyTssUpdater {
        require(_tssAddress != address(0), "ZetaConnector: invalid tssAddress");

        tssAddress = _tssAddress;
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
