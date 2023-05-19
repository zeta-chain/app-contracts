// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";

import "./RewardDistributor.sol";

contract RewardDistributorFactory {
    address public immutable zetaTokenAddress;
    SystemContract private immutable _systemContract;

    mapping(uint256 => address) public incentivesContracts;
    uint256 public incentivesContractsLen;

    event RewardDistributorCreated(
        address rewardDistributorContract,
        address stakingTokenA,
        address stakingTokenB,
        address LPStakingToken,
        address rewardsToken,
        address owner
    );

    constructor(address _zetaTokenAddress, address systemContract) {
        zetaTokenAddress = _zetaTokenAddress;
        _systemContract = SystemContract(systemContract);
    }

    function createTokenIncentive(
        address owner,
        ///@dev _rewardsDistribution is one who can set the amount of token to reward
        address rewardsDistribution,
        address rewardsToken,
        address stakingTokenA,
        address stakingTokenB
    ) external {
        if (stakingTokenB == address(0)) {
            stakingTokenB = zetaTokenAddress;
        }
        if (rewardsToken == address(0)) {
            rewardsToken = zetaTokenAddress;
        }
        address LPTokenAddress = _systemContract.uniswapv2PairFor(
            _systemContract.uniswapv2FactoryAddress(),
            stakingTokenA,
            stakingTokenB
        );
        RewardDistributor incentiveContract = new RewardDistributor(
            owner,
            rewardsDistribution,
            rewardsToken,
            LPTokenAddress,
            stakingTokenA,
            stakingTokenB,
            address(_systemContract)
        );
        incentivesContracts[incentivesContractsLen++] = address(incentiveContract);

        emit RewardDistributorCreated(
            address(incentiveContract),
            stakingTokenA,
            stakingTokenB,
            LPTokenAddress,
            rewardsToken,
            owner
        );
    }

    function getIncentiveContracts() public view returns (address[] memory) {
        address[] memory result = new address[](incentivesContractsLen);
        for (uint256 i = 0; i < incentivesContractsLen; i++) {
            result[i] = incentivesContracts[i];
        }
        return result;
    }
}
