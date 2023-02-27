// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "@zetachain/zevm-protocol-contracts/contracts/interfaces/IZRC20.sol";

library SwapHelperLib {
    uint16 internal constant MAX_DEADLINE = 200;

    error WrongGasContract();

    error NotEnoughToPayGasFee();

    error CantBeIdenticalAddresses();

    error CantBeZeroAddress();

    // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        if (tokenA == tokenB) revert CantBeIdenticalAddresses();
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        if (token0 == address(0)) revert CantBeZeroAddress();
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function uniswapv2PairFor(address factory, address tokenA, address tokenB) public pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            hex"ff",
                            factory,
                            keccak256(abi.encodePacked(token0, token1)),
                            hex"96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f" // init code hash
                        )
                    )
                )
            )
        );
    }

    function _doWithdrawal(address targetZRC20, uint256 amount, bytes32 receipient) internal {
        (address gasZRC20, uint256 gasFee) = IZRC20(targetZRC20).withdrawGasFee();

        if (gasZRC20 != targetZRC20) revert WrongGasContract();
        if (gasFee >= amount) revert NotEnoughToPayGasFee();

        IZRC20(targetZRC20).approve(targetZRC20, gasFee);
        IZRC20(targetZRC20).withdraw(abi.encodePacked(receipient), amount - gasFee);
    }

    function _existsPairPool(address uniswapV2Factory, address zrc20A, address zrc20B) internal view returns (bool) {
        address uniswapPool = uniswapv2PairFor(uniswapV2Factory, zrc20A, zrc20B);
        return IZRC20(zrc20A).balanceOf(uniswapPool) > 0 && IZRC20(zrc20B).balanceOf(uniswapPool) > 0;
    }

    function _doSwap(
        address zetaToken,
        address uniswapV2Factory,
        address uniswapV2Router,
        address zrc20,
        uint256 amount,
        address targetZRC20,
        uint256 minAmountOut
    ) internal returns (uint256) {
        bool existsPairPool = _existsPairPool(uniswapV2Factory, zrc20, targetZRC20);

        address[] memory path;
        if (existsPairPool) {
            path = new address[](2);
            path[0] = zrc20;
            path[1] = targetZRC20;
        } else {
            path = new address[](3);
            path[0] = zrc20;
            path[1] = zetaToken;
            path[2] = targetZRC20;
        }

        IZRC20(zrc20).approve(address(uniswapV2Router), amount);
        uint256[] memory amounts = IUniswapV2Router01(uniswapV2Router).swapExactTokensForTokens(
            amount,
            minAmountOut,
            path,
            address(this),
            block.timestamp + MAX_DEADLINE
        );
        return amounts[path.length - 1];
    }
}
