// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract InstantRewards is Ownable, Pausable, ReentrancyGuard {
    /* An ECDSA signature. */
    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct ClaimData {
        address to;
        Signature signature;
        bytes32 taskId;
        uint256 amount;
    }

    mapping(address => mapping(bytes32 => bool)) public taskCompletedByUser;

    address public signerAddress;

    event Claimed(address indexed to, bytes32 indexed taskId, uint256 amount);

    error InvalidSigner();
    error InvalidAddress();
    error TaskAlreadyClaimed();
    error TransferFailed();

    constructor(address signerAddress_, address owner) Ownable() {
        if (signerAddress_ == address(0)) revert InvalidAddress();
        transferOwnership(owner);
        signerAddress = signerAddress_;
    }

    function _verify(ClaimData memory claimData) private view {
        bytes32 payloadHash = _calculateHash(claimData);

        bytes32 messageHash = ECDSA.toEthSignedMessageHash(payloadHash);

        address messageSigner = ECDSA.recover(
            messageHash,
            claimData.signature.v,
            claimData.signature.r,
            claimData.signature.s
        );

        if (signerAddress != messageSigner) revert InvalidSigner();
    }

    // Function to compute the hash of the data and tasks for a token
    function _calculateHash(ClaimData memory claimData) private pure returns (bytes32) {
        bytes memory encodedData = abi.encode(claimData.to, claimData.taskId, claimData.amount);

        return keccak256(encodedData);
    }

    function claim(ClaimData memory claimData) external whenNotPaused nonReentrant {
        claimData.to = msg.sender;
        _verify(claimData);

        if (taskCompletedByUser[claimData.to][claimData.taskId]) revert TaskAlreadyClaimed();

        taskCompletedByUser[claimData.to][claimData.taskId] = true;

        (bool success, ) = claimData.to.call{value: claimData.amount}("");
        if (!success) revert TransferFailed();

        emit Claimed(claimData.to, claimData.taskId, claimData.amount);
    }

    function setSignerAddress(address signerAddress_) external onlyOwner {
        if (signerAddress_ == address(0)) revert InvalidAddress();
        signerAddress = signerAddress_;
    }

    function withdraw(address wallet) external onlyOwner {
        if (wallet == address(0)) revert InvalidAddress();
        payable(wallet).transfer(address(this).balance);
    }

    receive() external payable {}
}
