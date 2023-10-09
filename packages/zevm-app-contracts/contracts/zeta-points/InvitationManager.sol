// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract InvitationManager {
    /* An ECDSA signature. */
    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    // Records the timestamp when a particular user accepted an invitation from an inviter.
    mapping(address => mapping(address => uint256)) public acceptedInvitationsTimestamp;

    // Store invitees for each inviter
    mapping(address => address[]) public inviteeLists;

    error UnrecognizedInvitation();
    error IndexOutOfBounds();
    event InvitationAccepted(address indexed inviter, address indexed invitee, uint256 indexed timestamp);

    function verifySignature(address inviter, address invitee, Signature calldata signature) private pure {
        bytes32 payloadHash = keccak256(abi.encode(inviter, invitee));
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", payloadHash));

        address signerOfMessage = ecrecover(messageHash, signature.v, signature.r, signature.s);
        if (inviter != signerOfMessage) revert UnrecognizedInvitation();
    }

    function confirmAndAcceptInvitation(address inviter, Signature calldata signature) external {
        if (acceptedInvitationsTimestamp[inviter][msg.sender] != 0) revert UnrecognizedInvitation();

        verifySignature(inviter, msg.sender, signature);

        acceptedInvitationsTimestamp[inviter][msg.sender] = block.timestamp;

        // Add the invitee to the inviter's list
        inviteeLists[inviter].push(msg.sender);

        emit InvitationAccepted(inviter, msg.sender, block.timestamp);
    }

    function getInviteeCount(address inviter) external view returns (uint256) {
        return inviteeLists[inviter].length;
    }

    function getInviteeAtIndex(address inviter, uint256 index) external view returns (address) {
        if (index >= inviteeLists[inviter].length) revert IndexOutOfBounds();
        return inviteeLists[inviter][index];
    }
}
