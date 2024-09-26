// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";

contract ProofOfLiveness {
    uint256 constant PROOF_PERIOD = 24 hours;
    uint256 constant LAST_PERIODS_LENGTH = 5;

    // Mapping to track the proof history for each user (last 5 proof timestamps)
    mapping(address => uint256[LAST_PERIODS_LENGTH]) public proofHistory;

    // Custom error for when a user has already proved liveness within the last PROOF_PERIOD
    error ProofWithinLast24Hours(uint256 lastProofTime);

    // Event to log when liveness is proved
    event LivenessProved(address indexed user, uint256 proofTimestamp);

    // The function to prove liveness, can only be called once every PROOF_PERIOD
    function proveLiveness() external {
        uint256 currentTime = block.timestamp;
        uint256 lastProofTime = proofHistory[msg.sender][0]; // The most recent proof timestamp is always stored in the first position

        // Check if the user has proved liveness within the last PROOF_PERIOD
        if (currentTime < lastProofTime + PROOF_PERIOD) {
            revert ProofWithinLast24Hours(lastProofTime);
        }

        // Shift the proof history and add the new timestamp
        _updateProofHistory(msg.sender, currentTime);

        // Emit an event to track the liveness proof
        emit LivenessProved(msg.sender, currentTime);
    }

    // Helper function to check if a user can prove liveness (returns true if PROOF_PERIOD has passed)
    function canProveLiveness(address user) external view returns (bool) {
        uint256 currentTime = block.timestamp;
        return currentTime >= proofHistory[user][0] + PROOF_PERIOD;
    }

    // View function to return the liveness proof status for the last LAST_PERIODS_LENGTH periods (each PROOF_PERIOD long)
    function getLastPeriodsStatus(address user) external view returns (bool[LAST_PERIODS_LENGTH] memory) {
        uint256 currentTime = block.timestamp;
        bool[LAST_PERIODS_LENGTH] memory proofStatus;

        for (uint256 i = 0; i < LAST_PERIODS_LENGTH; i++) {
            // Calculate the end of the period (going back i * PROOF_PERIOD)
            uint256 periodEnd = currentTime - (i * PROOF_PERIOD);
            uint256 periodStart = periodEnd - PROOF_PERIOD - 1;
            // If the proof timestamp falls within this period, mark it as true
            proofStatus[i] = hasProofedAt(user, periodStart, periodEnd);
        }

        return proofStatus;
    }

    function hasProofedAt(address user, uint256 periodStart, uint256 periodEnd) public view returns (bool) {
        for (uint256 i = 0; i < LAST_PERIODS_LENGTH; i++) {
            if (proofHistory[user][i] >= periodStart && proofHistory[user][i] < periodEnd) {
                return true;
            }
        }
        return false;
    }

    function getProofHistory(address user) external view returns (uint256[LAST_PERIODS_LENGTH] memory) {
        return proofHistory[user];
    }

    // Internal function to update the user's proof history by shifting timestamps and adding the new proof
    function _updateProofHistory(address user, uint256 newProofTimestamp) internal {
        // Shift the history to the right
        for (uint256 i = LAST_PERIODS_LENGTH - 1; i > 0; i--) {
            proofHistory[user][i] = proofHistory[user][i - 1];
        }

        // Add the new timestamp in the first position
        proofHistory[user][0] = newProofTimestamp;
    }
}
