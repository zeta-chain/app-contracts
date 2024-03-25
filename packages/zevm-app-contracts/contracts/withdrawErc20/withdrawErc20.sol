// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";

import "@zetachain/toolkit/contracts/SwapHelperLib.sol";

contract WithdrawERC20 {
    uint16 internal constant MAX_DEADLINE = 200;
    SystemContract public immutable systemContract;

    error InsufficientInputAmount();

    constructor(address systemContractAddress) {
        systemContract = SystemContract(systemContractAddress);
    }

    function swapTokensForExactTokens(
        address zetaToken,
        address uniswapV2Router,
        address zrc20,
        uint256 amount,
        address targetZRC20,
        uint256 amountInMax
    ) internal returns (uint256) {
        address[] memory path;
        path = new address[](3);
        path[0] = zrc20;
        path[1] = zetaToken;
        path[2] = targetZRC20;

        IZRC20(zrc20).approve(address(uniswapV2Router), amountInMax);
        uint256[] memory amounts = IUniswapV2Router01(uniswapV2Router).swapTokensForExactTokens(
            amount,
            amountInMax,
            path,
            address(this),
            block.timestamp + MAX_DEADLINE
        );
        return amounts[0];
    }

    function withdraw(address zrc20, uint256 amount, bytes memory to) external virtual {
        IZRC20(zrc20).transferFrom(msg.sender, address(this), amount);

        (address gasZRC20, uint256 gasFee) = IZRC20(zrc20).withdrawGasFee();

        uint256 inputForGas = swapTokensForExactTokens(
            systemContract.wZetaContractAddress(),
            systemContract.uniswapv2Router02Address(),
            zrc20,
            gasFee,
            gasZRC20,
            amount
        );

        if (inputForGas > amount) revert InsufficientInputAmount();

        IZRC20(gasZRC20).approve(zrc20, gasFee);
        IZRC20(zrc20).withdraw(to, amount - inputForGas);
    }
}
