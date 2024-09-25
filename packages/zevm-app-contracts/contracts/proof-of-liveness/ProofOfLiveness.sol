// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProofOfLiveness {
    // Mapping to track the last time the user proved liveness
    mapping(address => uint256) public lastProofTimestamp;

    // Custom error for when a user has already proved liveness within the last 24 hours
    error ProofWithinLast24Hours(uint256 lastProofTime);

    // Event to log when liveness is proved
    event LivenessProved(address indexed user, uint256 proofTimestamp);

    // The function to prove liveness, can only be called once every 24 hours
    function proveLiveness() external {
        uint256 currentTime = block.timestamp;
        uint256 lastProofTime = lastProofTimestamp[msg.sender];

        // Check if the user has proved liveness within the last 24 hours
        if (currentTime < lastProofTime + 24 hours) {
            revert ProofWithinLast24Hours(lastProofTime);
        }

        // Update the last proof timestamp for the user
        lastProofTimestamp[msg.sender] = currentTime;

        // Emit an event to track the liveness proof
        emit LivenessProved(msg.sender, currentTime);
    }

    // Helper function to check if a user can prove liveness (returns true if 24 hours have passed)
    function canProveLiveness(address user) external view returns (bool) {
        uint256 currentTime = block.timestamp;
        return currentTime >= lastProofTimestamp[user] + 24 hours;
    }

    // View function to return the liveness proof status for the last 5 periods (each 24 hours long)
    function getLastFivePeriodsStatus(address user) external view returns (bool[5] memory) {
        uint256 currentTime = block.timestamp;
        uint256 lastProofTime = lastProofTimestamp[user];

        bool[5] memory proofStatus;
        uint256 periodDuration = 24 hours;

        for (uint256 i = 0; i < 5; i++) {
            // Calculate the start of the period (going back i * 24 hours)
            uint256 periodStart = currentTime - (i * periodDuration);
            uint256 periodEnd = periodStart - periodDuration;

            // If the last proof timestamp falls within this period, mark it as true
            if (lastProofTime >= periodEnd && lastProofTime < periodStart) {
                proofStatus[i] = true;
            } else {
                proofStatus[i] = false;
            }
        }

        return proofStatus;
    }
}
