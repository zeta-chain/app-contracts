// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

import "@zetachain/zevm-protocol-contracts/contracts/system/SystemContract.sol";

import "./Synthetixio/StakingRewards.sol";
import "./StakingRewardsLib.sol";

contract RewardDistributor is StakingRewards {
    uint16 internal constant MAX_DEADLINE = 200;

    IERC20 public zetaToken;
    SystemContract private systemContract;

    constructor(
        address _owner,
        address _rewardsDistribution,
        address _rewardsToken,
        address _stakingToken,
        address _zetaToken,
        address _systemContract
    ) public StakingRewards(_owner, _rewardsDistribution, _rewardsToken, _stakingToken) {
        zetaToken = IERC20(_zetaToken);
        systemContract = SystemContract(_systemContract);
    }

    function _deposit(
        address tokenAddress,
        address poolAddress,
        uint256 tokenAmount,
        uint256 zetaAmount
    ) internal returns (uint256) {
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), tokenAmount);
        IERC20(tokenAddress).approve(systemContract.uniswapv2Router02Address, tokenAmount);
        zetaToken.approve(systemContract.uniswapv2Router02Address, zetaAmount);
        (, , uint LPTokenAmount) = IUniswapV2Router02(systemContract.uniswapv2Router02Address).addLiquidity(
            tokenAddress,
            address(zetaToken),
            tokenAmount,
            zetaAmount,
            0,
            0,
            address(this),
            block.timestamp + MAX_DEADLINE
        );

        return LPTokenAmount;
    }

    function addLiquidityAndStake(address tokenAddress, uint256 amount) external {
        require(amount > 0, "Cannot stake 0");
        uint256 poolAddress = systemContract.uniswapv2PairFor(
            systemContract.uniswapv2FactoryAddress,
            tokenAddress,
            address(zetaToken)
        );
        require(poolAddress == stakingToken, "Token is not valid");
        uint256 zetaNeeded = StakingRewardsLib._zetaByTokenAmount(poolAddress, amount);
        uint256 LPTokenAmount = _deposit(tokenAddress, poolAddress, amount, zetaNeeded);
        stake(LPTokenAmount);
    }
}
