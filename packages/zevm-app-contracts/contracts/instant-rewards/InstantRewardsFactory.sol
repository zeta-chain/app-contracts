// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "./InstantRewardsV2.sol";

contract InstantRewardsFactory is Ownable2Step {
    bool public allowPublicCreation = false;

    error AccessDenied();
    event InstantRewardsCreated(address indexed instantRewards, address indexed owner);

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
        string memory name
    ) external returns (address) {
        bool isOwner = owner() == msg.sender;
        if (!allowPublicCreation && !isOwner) revert AccessDenied();

        InstantRewardsV2 instantRewards = new InstantRewardsV2(signerAddress, owner(), start, end, name);
        instantRewards.transferOwnership(owner());
        emit InstantRewardsCreated(address(instantRewards), owner());
        return address(instantRewards);
    }
}
