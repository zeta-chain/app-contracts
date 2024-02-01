// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/toolkit/contracts/SwapHelperLib.sol";

contract WithdrawERC20 {
    SystemContract public immutable systemContract;

    constructor(address systemContractAddress) {
        systemContract = SystemContract(systemContractAddress);
    }

    function withdraw(address zrc20, uint256 amount, bytes memory to) external virtual {
        IZRC20(zrc20).transferFrom(msg.sender, address(this), amount);

        (address gasZRC20, uint256 gasFee) = IZRC20(zrc20).withdrawGasFee();

        uint256 inputForGas = SwapHelperLib.swapTokensForExactTokens(
            systemContract.wZetaContractAddress(),
            systemContract.uniswapv2FactoryAddress(),
            systemContract.uniswapv2Router02Address(),
            zrc20,
            gasFee,
            gasZRC20,
            amount
        );

        IZRC20(gasZRC20).approve(zrc20, gasFee);
        IZRC20(zrc20).withdraw(to, amount - inputForGas);
    }
}
