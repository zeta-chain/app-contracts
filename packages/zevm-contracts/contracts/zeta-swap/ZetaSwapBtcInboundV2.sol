// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../shared/BytesHelperLib.sol";
import "../shared/SwapHelperLib.sol";
import "../interfaces/zContract.sol";
import "../system/SystemContract.sol";
import "./ZetaSwap.sol";

contract ZetaSwapBtcInboundV2 is ZetaSwap {
    address immutable systemContractAddress;

    constructor(
        address zetaToken_,
        address uniswapV2Router_,
        address systemContractAddress_
    ) ZetaSwap(zetaToken_, uniswapV2Router_) {
        systemContractAddress = systemContractAddress_;
    }

    function onCrossChainCall(address zrc20, uint256 amount, bytes calldata message) external override {
        address receipient = BytesHelperLib.bytesToAddress(message, 0, 20);
        uint32 targetZRC20ChainId = BytesHelperLib.bytesToUint32(message, 20, 4);
        address targetZRC20 = SystemContract(systemContractAddress).gasCoinZRC20ByChainId(targetZRC20ChainId);

        uint256 outputAmount = SwapHelperLib._doSwap(zetaToken, uniswapV2Router, zrc20, amount, targetZRC20, 0);
        SwapHelperLib._doWithdrawal(targetZRC20, outputAmount, BytesHelperLib.addressToBytes(receipient));
    }
}
