// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProofOfLiveness {
    uint256 constant PROOF_PERIOD = 24 hours;
    uint256 constant LAST_PERIODS_LENGTH = 5;

    // Mapping to track the last time the user proved liveness
    mapping(address => uint256) public lastProofTimestamp;

    // Custom error for when a user has already proved liveness within the last PROOF_PERIOD
    error ProofWithinLast24Hours(uint256 lastProofTime);

    // Event to log when liveness is proved
    event LivenessProved(address indexed user, uint256 proofTimestamp);

    // The function to prove liveness, can only be called once every PROOF_PERIOD
    function proveLiveness() external {
        uint256 currentTime = block.timestamp;
        uint256 lastProofTime = lastProofTimestamp[msg.sender];

        // Check if the user has proved liveness within the last PROOF_PERIOD
        if (currentTime < lastProofTime + PROOF_PERIOD) {
            revert ProofWithinLast24Hours(lastProofTime);
        }

        // Update the last proof timestamp for the user
        lastProofTimestamp[msg.sender] = currentTime;

        // Emit an event to track the liveness proof
        emit LivenessProved(msg.sender, currentTime);
    }

    // Helper function to check if a user can prove liveness (returns true if PROOF_PERIOD have passed)
    function canProveLiveness(address user) external view returns (bool) {
        uint256 currentTime = block.timestamp;
        return currentTime >= lastProofTimestamp[user] + PROOF_PERIOD;
    }

    // View function to return the liveness proof status for the last LAST_PERIODS_LENGTH periods (each PROOF_PERIOD long)
    function getLastPeriodsStatus(address user) external view returns (bool[LAST_PERIODS_LENGTH] memory) {
        uint256 currentTime = block.timestamp;
        uint256 lastProofTime = lastProofTimestamp[user];

        bool[LAST_PERIODS_LENGTH] memory proofStatus;
        uint256 periodDuration = PROOF_PERIOD;

        for (uint256 i = 0; i < LAST_PERIODS_LENGTH; i++) {
            // Calculate the start of the period (going back i * PROOF_PERIOD)
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
