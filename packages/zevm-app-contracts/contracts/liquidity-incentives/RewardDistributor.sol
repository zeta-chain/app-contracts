// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

import "@zetachain/zevm-protocol-contracts/contracts/system/SystemContract.sol";

import "./Synthetixio/StakingRewards.sol";

contract RewardDistributor is StakingRewards {
    uint16 internal constant MAX_DEADLINE = 200;

    IERC20 public stakingTokenA;
    IERC20 public stakingTokenB;
    SystemContract private systemContract;

    error ZeroStakeAmount();
    error InvalidTokenAddress();

    constructor(
        address _owner,
        address _rewardsDistribution,
        address _rewardsToken,
        address _stakingToken,
        address _stakingTokenA,
        address _stakingTokenB,
        address _systemContract
    ) StakingRewards(_owner, _rewardsDistribution, _rewardsToken, _stakingToken) {
        stakingTokenA = IERC20(_stakingTokenA);
        stakingTokenB = IERC20(_stakingTokenB);
        systemContract = SystemContract(_systemContract);
    }

    function _deposit(uint256 tokenAmountA, uint256 tokenAmountB) internal returns (uint256) {
        stakingTokenA.transferFrom(msg.sender, address(this), tokenAmountA);
        stakingTokenA.approve(systemContract.uniswapv2Router02Address(), tokenAmountA);

        stakingTokenB.transferFrom(msg.sender, address(this), tokenAmountB);
        stakingTokenB.approve(systemContract.uniswapv2Router02Address(), tokenAmountB);

        (, , uint LPTokenAmount) = IUniswapV2Router02(systemContract.uniswapv2Router02Address()).addLiquidity(
            address(stakingTokenA),
            address(stakingTokenB),
            tokenAmountA,
            tokenAmountB,
            0,
            0,
            address(this),
            block.timestamp + MAX_DEADLINE
        );

        return LPTokenAmount;
    }

    /// @param tokenAddress Token you already know the amount you want to deposit
    /// @param amount Amount of token you want to deposit
    /// @return Amount of the other token you will need to execute addLiquidityAndStake
    function otherTokenByAmount(address tokenAddress, uint256 amount) public view returns (uint256) {
        address otherTokenAddress = address(stakingTokenA) == tokenAddress
            ? address(stakingTokenB)
            : address(stakingTokenA);
        address poolAddress = systemContract.uniswapv2PairFor(
            systemContract.uniswapv2FactoryAddress(),
            tokenAddress,
            otherTokenAddress
        );
        (uint256 tokenReserve, uint256 otherTokenReserve, ) = IUniswapV2Pair(poolAddress).getReserves();

        if (IUniswapV2Pair(poolAddress).token0() == otherTokenAddress)
            (otherTokenReserve, tokenReserve) = (tokenReserve, otherTokenReserve);

        return (otherTokenReserve * amount) / tokenReserve;
    }

    function addLiquidityAndStake(address tokenAddress, uint256 amount) external {
        if (amount == 0) revert ZeroStakeAmount();
        address otherTokenAddress = address(stakingTokenA) == tokenAddress
            ? address(stakingTokenB)
            : address(stakingTokenA);
        address poolAddress = systemContract.uniswapv2PairFor(
            systemContract.uniswapv2FactoryAddress(),
            tokenAddress,
            otherTokenAddress
        );
        if (poolAddress != address(stakingToken)) revert InvalidTokenAddress();
        uint256 otherTokenRequired = otherTokenByAmount(tokenAddress, amount);

        if (tokenAddress == address(stakingTokenB)) {
            (amount, otherTokenRequired) = (otherTokenRequired, amount);
        }

        uint256 LPTokenAmount = _deposit(amount, otherTokenRequired);
        _stakeFromContract(LPTokenAmount);
    }
}
