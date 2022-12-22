// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../system/SystemContract.sol";
import "../interfaces/IZRC20.sol";
import "../interfaces/zContract.sol";
import "../shared/BytesHelperLib.sol";
import "../shared/SwapHelperLib.sol";

interface ZetaMultiOutputErrors {
    error NoTransfersToDo();
}

contract ZetaMultiOutput is zContract, Ownable, ZetaMultiOutputErrors {
    SystemContract public immutable systemContract;
    address[] public destinationTokens;

    event destinationRegistered(address);
    event withdrawal(address, uint256, address);

    constructor(address systemContractAddress) {
        systemContract = SystemContract(systemContractAddress);
    }

    function registerDestinationToken(address destinationToken) external onlyOwner {
        destinationTokens.push(destinationToken);
        emit destinationRegistered(destinationToken);
    }

    function _transfersToDo(address zrc20) internal view returns (uint256) {
        uint256 total = 0;
        for (uint256 i; i < destinationTokens.length; i++) {
            if (destinationTokens[i] == zrc20) continue;
            total++;
        }

        return total;
    }

    function onCrossChainCall(address zrc20, uint256 amount, bytes calldata message) external virtual override {
        if (_transfersToDo(zrc20) == 0) revert NoTransfersToDo();

        address receipient = BytesHelperLib.bytesToAddress(message, 0);
        uint256 amountToTransfer = amount / _transfersToDo(zrc20);
        uint256 leftOver = amount - amountToTransfer * _transfersToDo(zrc20);

        uint256 lastTransferIndex = destinationTokens[destinationTokens.length - 1] == zrc20
            ? destinationTokens.length - 2
            : destinationTokens.length - 1;

        for (uint256 i; i < destinationTokens.length; i++) {
            address targetZRC20 = destinationTokens[i];
            if (targetZRC20 == zrc20) continue;

            if (lastTransferIndex == i) {
                amountToTransfer += leftOver;
            }

            uint256 outputAmount = SwapHelperLib._doSwap(
                systemContract.wZetaContractAddress(),
                systemContract.uniswapv2FactoryAddress(),
                systemContract.uniswapv2Router02Address(),
                zrc20,
                amountToTransfer,
                targetZRC20,
                0
            );
            SwapHelperLib._doWithdrawal(targetZRC20, outputAmount, BytesHelperLib.addressToBytes(receipient));
            emit withdrawal(targetZRC20, outputAmount, receipient);
        }
    }
}
