// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../shared/SwapHelperLib.sol";
import "../interfaces/zContract.sol";

contract ZetaSwapV2 is zContract {
    address public zetaToken;
    address public immutable uniswapV2Router;

    constructor(address zetaToken_, address uniswapV2Router_) {
        zetaToken = zetaToken_;
        uniswapV2Router = uniswapV2Router_;
    }

    function onCrossChainCall(address zrc20, uint256 amount, bytes calldata message) external virtual override {
        (address targetZRC20, bytes32 receipient, uint256 minAmountOut) = abi.decode(
            message,
            (address, bytes32, uint256)
        );
        uint256 outputAmount = SwapHelperLib._doSwap(
            zetaToken,
            uniswapV2Router,
            zrc20,
            amount,
            targetZRC20,
            minAmountOut
        );
        SwapHelperLib._doWithdrawal(targetZRC20, outputAmount, receipient);
    }
}
