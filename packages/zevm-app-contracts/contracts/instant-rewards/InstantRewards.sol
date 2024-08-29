// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

contract InstantRewards is Ownable, Pausable, ReentrancyGuard, EIP712 {
    bytes32 private constant CLAIM_TYPEHASH =
        keccak256("Claim(address to,uint256 sigExpiration,bytes32 taskId,uint256 amount)");

    struct ClaimData {
        address to;
        bytes signature;
        uint256 sigExpiration;
        bytes32 taskId;
        uint256 amount;
    }

    mapping(address => mapping(bytes32 => bool)) public taskCompletedByUser;

    address public signerAddress;

    event Claimed(address indexed to, bytes32 indexed taskId, uint256 amount);
    event Withdrawn(address indexed wallet, uint256 amount);

    error InvalidSigner();
    error SignatureExpired();
    error InvalidAddress();
    error TaskAlreadyClaimed();
    error TransferFailed();

    constructor(address signerAddress_, address owner) Ownable() EIP712("InstantRewards", "1") {
        if (signerAddress_ == address(0)) revert InvalidAddress();
        transferOwnership(owner);
        signerAddress = signerAddress_;
    }

    function _verify(ClaimData memory claimData) private view {
        bytes32 structHash = keccak256(
            abi.encode(CLAIM_TYPEHASH, claimData.to, claimData.sigExpiration, claimData.taskId, claimData.amount)
        );
        bytes32 constructedHash = _hashTypedDataV4(structHash);

        if (!SignatureChecker.isValidSignatureNow(signerAddress, constructedHash, claimData.signature)) {
            revert InvalidSigner();
        }

        if (block.timestamp > claimData.sigExpiration) revert SignatureExpired();
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

    function withdraw(address wallet, uint256 amount) external onlyOwner {
        if (wallet == address(0)) revert InvalidAddress();
        if (amount > address(this).balance) revert TransferFailed();
        payable(wallet).transfer(amount);
        emit Withdrawn(wallet, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {}
}
