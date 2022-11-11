// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./ZetaSwap.sol";

contract ZetaSwapBtcInbound is ZetaSwap {
    constructor(address zetaToken_, address uniswapV2Router_) ZetaSwap(zetaToken_, uniswapV2Router_) {}

    function bytesToAddress(
        bytes calldata data,
        uint256 offset,
        uint256 size
    ) private pure returns (address addr) {
        bytes memory b = message[offset:size];
        assembly {
            addr := mload(add(b, size))
        }
    }

    function onCrossChainCall(
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        address targetZRC20 = bytesToAddress(message, 0, 20);
        address receipient = bytesToAddress(message, 21, 20);

        _doSwap(zrc20, amount, targetZRC20, bytes32(uint256(uint160(receipient))), 0);
    }
}
