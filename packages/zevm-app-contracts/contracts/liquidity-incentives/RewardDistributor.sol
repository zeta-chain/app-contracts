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

    IERC20 public zetaToken;
    SystemContract private systemContract;

    constructor(
        address _owner,
        address _rewardsDistribution,
        address _rewardsToken,
        address _stakingToken,
        address _zetaToken,
        address _systemContract
    ) StakingRewards(_owner, _rewardsDistribution, _rewardsToken, _stakingToken) {
        zetaToken = IERC20(_zetaToken);
        systemContract = SystemContract(_systemContract);
    }

    function _deposit(address tokenAddress, uint256 tokenAmount, uint256 zetaAmount) internal returns (uint256) {
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), tokenAmount);
        IERC20(tokenAddress).approve(systemContract.uniswapv2Router02Address(), tokenAmount);

        zetaToken.transferFrom(msg.sender, address(this), zetaAmount);
        zetaToken.approve(systemContract.uniswapv2Router02Address(), zetaAmount);

        (, , uint LPTokenAmount) = IUniswapV2Router02(systemContract.uniswapv2Router02Address()).addLiquidity(
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

    function zetaByTokenAmount(address tokenAddress, uint256 amount) public view returns (uint256) {
        address poolAddress = systemContract.uniswapv2PairFor(
            systemContract.uniswapv2FactoryAddress(),
            tokenAddress,
            address(zetaToken)
        );
        (uint256 tokenReserve, uint256 zetaReserve, ) = IUniswapV2Pair(poolAddress).getReserves();
        if (IUniswapV2Pair(poolAddress).token0() == address(zetaToken))
            (zetaReserve, tokenReserve) = (tokenReserve, zetaReserve);

        return (zetaReserve * amount) / tokenReserve;
    }

    function addLiquidityAndStake(address tokenAddress, uint256 amount) external {
        require(amount > 0, "Cannot stake 0");
        address poolAddress = systemContract.uniswapv2PairFor(
            systemContract.uniswapv2FactoryAddress(),
            tokenAddress,
            address(zetaToken)
        );
        require(poolAddress == address(stakingToken), "Token is not valid");
        uint256 zetaNeeded = zetaByTokenAmount(tokenAddress, amount);
        uint256 LPTokenAmount = _deposit(tokenAddress, amount, zetaNeeded);
        // stake(LPTokenAmount)
        _totalSupply = _totalSupply + LPTokenAmount;
        _balances[msg.sender] = _balances[msg.sender] + LPTokenAmount;
        emit Staked(msg.sender, LPTokenAmount);
    }
}
