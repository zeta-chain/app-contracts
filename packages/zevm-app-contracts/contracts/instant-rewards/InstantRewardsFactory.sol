// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./InstantRewardsV2.sol";

contract InstantRewardsFactory is Ownable {
    bool public allowPublicCreation = false;

    error AccessDenied();
    error InvalidSignerAddress();
    error EmptyName();
    error StartTimeInPast();
    error EndTimeBeforeStart();

    event InstantRewardsCreated(address indexed instantRewards, address indexed owner, string indexed name);

    constructor(address owner) Ownable() {
        transferOwnership(owner);
    }

    function setAllowPublicCreation(bool allowPublicCreation_) external onlyOwner {
        allowPublicCreation = allowPublicCreation_;
    }

    function createInstantRewards(
        address signerAddress,
        uint256 start,
        uint256 end,
        string memory name,
        string memory promoUrl,
        string memory avatarUrl,
        string memory description
    ) external returns (address) {
        if (signerAddress == address(0)) revert InvalidSignerAddress();
        if (bytes(name).length == 0) revert EmptyName();
        if (start < block.timestamp) revert StartTimeInPast();
        if (end <= start) revert EndTimeBeforeStart();

        bool isOwner = owner() == msg.sender;
        if (!allowPublicCreation && !isOwner) revert AccessDenied();

        InstantRewardsV2 instantRewards = new InstantRewardsV2(
            signerAddress,
            owner(),
            start,
            end,
            name,
            promoUrl,
            avatarUrl,
            description
        );
        instantRewards.transferOwnership(owner());
        emit InstantRewardsCreated(address(instantRewards), owner(), name);
        return address(instantRewards);
    }
}
