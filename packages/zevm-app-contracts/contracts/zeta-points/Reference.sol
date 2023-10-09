// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract Reference {
    /* An ECDSA signature. */
    struct Sig {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    mapping(address => mapping(address => uint256)) public invitations;

    error InvalidInvitation();
    event Invitation(address indexed inviter, address indexed invitee);

    function validateInvitation(address inviter, address invitee, Sig calldata sig) private view {
        bytes32 payloadHash = keccak256(abi.encode(inviter, invitee));
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", payloadHash));

        address actualSigner = ecrecover(messageHash, sig.v, sig.r, sig.s);
        if (inviter != actualSigner) revert InvalidInvitation();
    }

    function acceptInvitation(address inviter, Sig calldata sig) external {
        if (invitations[inviter][msg.sender] != address(0)) revert InvalidInvitation();
        validateInvitation(inviter, msg.sender, sig);
        invitations[inviter][msg.sender] = block.timestamp;
        emit Invitation(inviter, msg.sender);
    }
}
