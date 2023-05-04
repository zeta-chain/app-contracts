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
    uint256 minCoolDown;
    uint256 minStakingPeriod;
    mapping(address => uint256) public lastDeposit;
    mapping(address => uint256) public unlockTokensAt;

    error ZeroStakeAmount();
    error InvalidTokenAddress();
    error MinimumStakingPeriodNotMet();

    constructor(
        address owner,
        address rewardsDistribution,
        address rewardsToken,
        address stakingToken,
        address stakingTokenA_,
        address stakingTokenB_,
        address systemContract_
    ) StakingRewards(owner, rewardsDistribution, rewardsToken, stakingToken) {
        stakingTokenA = IERC20(stakingTokenA_);
        stakingTokenB = IERC20(stakingTokenB_);
        systemContract = SystemContract(systemContract_);
    }

    function _addLiquidity(uint256 tokenAmountA, uint256 tokenAmountB) internal returns (uint256) {
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

    function addLiquidityAndStake(address tokenAddress, uint256 amount) external nonReentrant {
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
        uint256 otherTokenAmount = otherTokenByAmount(tokenAddress, amount);

        if (tokenAddress == address(stakingTokenB)) {
            (amount, otherTokenAmount) = (otherTokenAmount, amount);
        }

        lastDeposit[msg.sender] = block.timestamp;
        unlockTokensAt[msg.sender] = type(uint256).max;
        uint256 LPTokenAmount = _addLiquidity(amount, otherTokenAmount);
        _stakeFromContract(LPTokenAmount);
    }

    function setMinCoolDown(uint256 minCoolDown_) external onlyOwner {
        minCoolDown = minCoolDown_;
    }

    function setMinStakingPeriod(uint256 minStakingPeriod_) external onlyOwner {
        minStakingPeriod = minStakingPeriod_;
    }

    function stake(uint256 amount) public override {
        if (amount == 0) revert ZeroStakeAmount();
        lastDeposit[msg.sender] = block.timestamp;
        unlockTokensAt[msg.sender] = type(uint256).max;
        super.stake(amount);
    }

    function beginCoolDown() external {
        if (lastDeposit[msg.sender] + minStakingPeriod > block.timestamp) revert MinimumStakingPeriodNotMet();
        unlockTokensAt[msg.sender] = block.timestamp + minCoolDown;
    }

    function withdraw(uint256 amount) public override {
        if (unlockTokensAt[msg.sender] > block.timestamp) revert MinimumStakingPeriodNotMet();
        super.withdraw(amount);
    }
}
