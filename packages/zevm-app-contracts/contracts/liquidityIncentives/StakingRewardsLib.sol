// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.7;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

library StakingRewardsLib {
    function _zetaByTokenAmount(address poolAddress, uint256 amount) internal view returns (uint256) {
        (uint256 tokenReserve, uint256 zetaReserve) = IUniswapV2Pair(poolAddress).getReserves();
        if (IUniswapV2Pair(poolAddress).token0() == address(zetaToken))
            (zetaReserve, tokenReserve) = (tokenReserve, zetaReserve);

        return (zetaReserve * amount) / tokenReserve;
    }
}
