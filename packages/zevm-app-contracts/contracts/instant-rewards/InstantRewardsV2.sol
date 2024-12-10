// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./InstantRewards.sol";

contract InstantRewardsV2 is InstantRewards {
    string public name;

    uint256 public start;
    uint256 public end;
    string public promoUrl;
    string public avatarUrl;
    string public description;

    event TimeframeUpdated(uint256 start, uint256 end);

    error InvalidTimeframe();
    error InstantRewardNotActive();
    error InstantRewardStillActive();

    constructor(
        address signerAddress_,
        address owner,
        uint256 start_,
        uint256 end_,
        string memory name_,
        string memory promoUrl_,
        string memory avatarUrl_,
        string memory description_
    ) InstantRewards(signerAddress_, owner) {
        if (signerAddress_ == address(0)) revert InvalidAddress();
        if (start_ > end_) revert InvalidTimeframe();
        start = start_;
        end = end_;
        name = name_;
        promoUrl = promoUrl_;
        avatarUrl = avatarUrl_;
        description = description_;
    }

    function isActive() public view returns (bool) {
        return block.timestamp >= start && block.timestamp <= end;
    }

    function setTimeframe(uint256 start_, uint256 end_) external onlyOwner {
        if (start_ > end_) revert InvalidTimeframe();
        if (start_ < block.timestamp || end_ < block.timestamp) revert InvalidTimeframe();
        if (isActive()) revert InstantRewardStillActive();
        start = start_;
        end = end_;
        emit TimeframeUpdated(start_, end_);
    }

    function claim(ClaimData memory claimData) public override {
        if (!isActive()) revert InstantRewardNotActive();
        super.claim(claimData);
    }

    function withdraw(address wallet, uint256 amount) public override onlyOwner {
        super.withdraw(wallet, amount);
    }
}
