// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@zetachain/zevm-protocol-contracts/contracts/system/SystemContract.sol";

import "./RewardDistributor.sol";

contract RewardDistributorFactory {
    address public immutable zetaTokenAddress;
    SystemContract private immutable systemContract;

    mapping(uint256 => address) public incentivesContracts;
    uint256 public incentivesContractsLen;

    event RewardDistributorCreated(address rewardDistributor, address stakingToken, address rewardToken);

    constructor(address _zetaTokenAddress, address _systemContract) {
        zetaTokenAddress = _zetaTokenAddress;
        systemContract = SystemContract(_systemContract);
    }

    function createIncentive(
        address _owner,
        ///@dev _rewardsDistribution is one who can set the amount of token to reward
        address _rewardsDistribution,
        address _stakingToken
    ) public {
        address LPTokenAddress = systemContract.uniswapv2PairFor(
            systemContract.uniswapv2FactoryAddress,
            _stakingToken,
            zetaTokenAddress
        );
        address incentiveContract = RewardDistributor(
            _owner,
            _rewardsDistribution,
            zetaTokenAddress,
            LPTokenAddress,
            zetaTokenAddress,
            address(systemContract)
        );
        incentivesContracts[incentivesContractsLen++] = incentiveContract;

        emit RewardDistributorCreated(incentiveContract, _stakingToken, zetaTokenAddress);
    }

    function getIncentiveContracts() public view returns (address[] memory) {
        address[] memory result = new address(incentivesContractsLen);
        for (uint256 i = 0; i < incentivesContractsLen; i++) {
            result[i] = incentivesContracts[i];
        }
        return result;
    }
}
