// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract Register {
    mapping(address => uint256) public verified;

    event UserVerification(address indexed user, uint256 timestamp);

    function verify() external {
        verified[msg.sender] = block.timestamp;
        emit UserVerification(msg.sender, block.timestamp);
    }

    function isVerified(address addr) external view returns (bool) {
        return verified[addr] > 0;
    }

    function whenVerified(address addr) external view returns (uint256) {
        return verified[addr];
    }
}
