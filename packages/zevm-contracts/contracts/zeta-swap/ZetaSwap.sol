// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";

import "../interfaces/IZRC4.sol";
import "../interfaces/zContract.sol";

interface ZetaSwapErrors {
    error WrongGasContract();

    error NotEnoughToPayGasFee();
}

contract ZetaSwap is zContract, ZetaSwapErrors {
    uint16 internal constant MAX_DEADLINE = 200;

    address public immutable uniswapV2Router;

    constructor(address uniswapV2Router_) {
        uniswapV2Router = uniswapV2Router_;
    }

    function encode(
        address zrc4,
        address recipient,
        uint256 minAmountOut
    ) public pure returns (bytes memory) {
        return abi.encode(zrc4, recipient, minAmountOut);
    }

    function doWithdrawal(
        address targetZRC4,
        uint256 amount,
        bytes32 receipient
    ) private {
        (address gasZRC4, uint256 gasFee) = IZRC4(targetZRC4).withdrawGasFee();

        if (gasZRC4 != targetZRC4) revert WrongGasContract();
        if (gasFee >= amount) revert NotEnoughToPayGasFee();

        IZRC4(targetZRC4).approve(targetZRC4, gasFee);
        IZRC4(targetZRC4).withdraw(receipient, amount - gasFee);
    }

    function onCrossChainCall(
        address zrc4,
        uint256 amount,
        bytes calldata message
    ) external override {
        (address targetZRC4, bytes32 receipient, uint256 minAmountOut) = abi.decode(
            message,
            (address, bytes32, uint256)
        );
        address[] memory path = new address[](2);
        path[0] = zrc4;
        path[1] = targetZRC4;

        IZRC4(zrc4).approve(address(uniswapV2Router_), amount);
        uint256[] memory amounts = IUniswapV2Router01(uniswapV2Router_).swapExactTokensForTokens(
            amount,
            minAmountOut,
            path,
            address(this),
            block.timestamp + MAX_DEADLINE
        );

        doWithdrawal(targetZRC4, amounts[1], receipient);
    }
}
