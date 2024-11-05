// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

import "./InvitationManager.sol";

contract InvitationManagerV2 is EIP712 {
    bytes32 private constant VERIFY_TYPEHASH = keccak256("Verify(address to,uint256 signatureExpiration)");

    InvitationManager public immutable invitationManager;

    struct VerifyData {
        address to;
        bytes signature;
        uint256 signatureExpiration;
    }

    // Records the timestamp when a particular user gets verified.
    mapping(address => uint256) public userVerificationTimestamps;

    error UserAlreadyVerified();
    error SignatureExpired();
    error InvalidSigner();

    event UserVerified(address indexed userAddress, uint256 verifiedAt, uint256 unix_timestamp);

    constructor(InvitationManager _invitationManager) EIP712("InvitationManagerV2", "1") {
        invitationManager = _invitationManager;
    }

    function _markAsVerified(address user) internal {
        // Check if the user is already verified
        if (hasBeenVerified(user)) revert UserAlreadyVerified();

        userVerificationTimestamps[user] = block.timestamp;
        emit UserVerified(user, block.timestamp, block.timestamp);
    }

    function markAsVerified() external {
        _markAsVerified(msg.sender);
    }

    function hasBeenVerified(address userAddress) public view returns (bool) {
        if (userVerificationTimestamps[userAddress] > 0) return true;
        if (address(invitationManager) != address(0) && invitationManager.hasBeenVerified(userAddress)) return true;
        return false;
    }

    function _verify(VerifyData memory claimData) private view {
        bytes32 structHash = keccak256(abi.encode(VERIFY_TYPEHASH, claimData.to, claimData.signatureExpiration));
        bytes32 constructedHash = _hashTypedDataV4(structHash);

        if (!SignatureChecker.isValidSignatureNow(claimData.to, constructedHash, claimData.signature)) {
            revert InvalidSigner();
        }

        if (block.timestamp > claimData.signatureExpiration) revert SignatureExpired();
    }

    function markAsVerifiedWithSignature(VerifyData memory data) external {
        _verify(data);
        _markAsVerified(data.to);
    }
}
