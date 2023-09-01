// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";

import "../shared/BytesHelperLib.sol";
import "../shared/SwapHelperLib.sol";

contract ZetaSwapBtcInbound is zContract {
    SystemContract public immutable systemContract;

    constructor(address systemContractAddress) {
        systemContract = SystemContract(systemContractAddress);
    }

    modifier onlySystem() {
        require(msg.sender == address(systemContract), "Only system contract can call this function");
        _;
    }

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external virtual override onlySystem {
        address receipient = BytesHelperLib.bytesToAddress(message, 0);
        uint32 targetZRC20ChainId = BytesHelperLib.bytesToUint32(message, 20);
        address targetZRC20 = systemContract.gasCoinZRC20ByChainId(targetZRC20ChainId);

        uint256 outputAmount = SwapHelperLib._doSwap(
            systemContract.wZetaContractAddress(),
            systemContract.uniswapv2FactoryAddress(),
            systemContract.uniswapv2Router02Address(),
            zrc20,
            amount,
            targetZRC20,
            0
        );
        SwapHelperLib._doWithdrawal(targetZRC20, outputAmount, BytesHelperLib.addressToBytes(receipient));
    }
}
