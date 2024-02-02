// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract InvitationManager {
    /* An ECDSA signature. */
    struct Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    // Indicate if invitation is still available. The default value is true.
    mapping(address => bool) public invitationEnabled;

    // Records the timestamp when a particular user gets verified.
    mapping(address => uint256) public userVerificationTimestamps;

    // Records the timestamp when a particular user accepted an invitation from an inviter.
    mapping(address => mapping(address => uint256)) public acceptedInvitationsTimestamp;

    // Store invitees for each inviter
    mapping(address => address[]) public inviteeLists;

    // Total invites accepted by day (using the start timestamp of each day as key)
    mapping(uint256 => uint256) public totalInvitesByDay;

    // Total invites accepted by inviter by day (using the start timestamp of each day as key)
    mapping(address => mapping(uint256 => uint256)) public totalInvitesByInviterByDay;

    error UserAlreadyVerified();
    error UserNotVerified();
    error UnrecognizedInvitation();
    error IndexOutOfBounds();
    error CanNotInviteYourself();

    event UserVerified(address indexed userAddress, uint256 verifiedAt, uint256 unix_timestamp);
    event InvitationAccepted(
        address indexed inviter,
        address indexed invitee,
        uint256 index,
        uint256 expiration,
        uint256 acceptedAt,
        uint256 unix_timestamp
    );

    function _markAsVerified(address user) internal {
        // Check if the user is already verified
        if (userVerificationTimestamps[user] > 0) revert UserAlreadyVerified();

        userVerificationTimestamps[user] = block.timestamp;
        emit UserVerified(user, block.timestamp, block.timestamp);
    }

    function markAsVerified() external {
        _markAsVerified(msg.sender);
        invitationEnabled[msg.sender] = true;
    }

    function updateInvitationStatus(bool value) external {
        if (userVerificationTimestamps[msg.sender] == 0) revert UserNotVerified();
        invitationEnabled[msg.sender] = value;
    }

    function hasBeenVerified(address userAddress) external view returns (bool) {
        return userVerificationTimestamps[userAddress] > 0;
    }

    function getVerifiedTimestamp(address userAddress) external view returns (uint256) {
        return userVerificationTimestamps[userAddress];
    }

    function _verifySignature(address inviter, uint256 expiration, Signature calldata signature) private pure {
        bytes32 payloadHash = keccak256(abi.encode(inviter, expiration));
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", payloadHash));

        address messageSigner = ecrecover(messageHash, signature.v, signature.r, signature.s);
        if (inviter != messageSigner) revert UnrecognizedInvitation();
    }

    function confirmAndAcceptInvitation(address inviter, uint256 expiration, Signature calldata signature) external {
        if (inviter == msg.sender) revert CanNotInviteYourself();
        if (!invitationEnabled[inviter]) revert UnrecognizedInvitation();

        _verifySignature(inviter, expiration, signature);

        if (expiration < block.timestamp) revert UnrecognizedInvitation();

        acceptedInvitationsTimestamp[inviter][msg.sender] = block.timestamp;
        _markAsVerified(msg.sender);

        // Add the invitee to the inviter's list
        inviteeLists[inviter].push(msg.sender);

        uint256 dayStartTimestamp = (block.timestamp / 86400) * 86400; // Normalize to the start of the day

        totalInvitesByDay[dayStartTimestamp]++;
        totalInvitesByInviterByDay[inviter][dayStartTimestamp]++;

        emit InvitationAccepted(
            inviter,
            msg.sender,
            inviteeLists[inviter].length - 1,
            expiration,
            block.timestamp,
            block.timestamp
        );
    }

    function getInviteeCount(address inviter) external view returns (uint256) {
        return inviteeLists[inviter].length;
    }

    function getInviteeAtIndex(address inviter, uint256 index) external view returns (address) {
        if (index >= inviteeLists[inviter].length) revert IndexOutOfBounds();
        return inviteeLists[inviter][index];
    }

    function getTotalInvitesOnDay(uint256 dayStartTimestamp) external view returns (uint256) {
        return totalInvitesByDay[dayStartTimestamp];
    }

    function getInvitesByInviterOnDay(address inviter, uint256 dayStartTimestamp) external view returns (uint256) {
        return totalInvitesByInviterByDay[inviter][dayStartTimestamp];
    }
}
