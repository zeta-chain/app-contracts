// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

interface ZetaGasPayerErrors {
    error ErrorSwappingTokens();
}

/**
 * @dev ZetaGasPayer makes it easier to handle usual cases while working with ZetaChain:
 *   - Getting Zeta using native coin (to pay for destination gas while using `connector.send`)
 *   - Getting Zeta using a token (to pay for destination gas while using `connector.send`)
 *   - Getting native coin using Zeta (to return unused destination gas when `onZetaRevert` is executed)
 *   - Getting a token using Zeta (to return unused destination gas when `onZetaRevert` is executed)
 */
contract ZetaGasPayer is ZetaGasPayerErrors {
    /**
     * @custom:todo (lucas): explain why 365
     */
    uint16 internal constant MAX_DEADLINE = 365;

    /**
     * @dev getZetaGasFromEth* functions make paying gas on destination chain more convenient for the end user
     */

    function getZetaGasFromEthUniswapV2() internal payable {
        address[] memory path = new address[](2);
        path[0] = wETH;
        path[1] = zetaToken;

        uint256[] memory amounts = uniswapV2Router.swapExactETHForTokens{value: msg.value}(
            0,
            path,
            address(this),
            block.timestamp + MAX_DEADLINE
        );

        uint256 zetaAmount = amounts[path.length - 1];

        if (zetaAmount == 0) revert ErrorSwappingTokens();
    }

    function getZetaGasFromEthUniswapV3() internal payable {
        /**
         * @custom:todo (lucas): implement
         */
    }

    /**
     * @dev getEthForZetaGas* functions are useful in revert cases
     */

    function getEthForZetaGasUniswapV2() internal payable {
        /**
         * @custom:todo (lucas): implement (probably having an owner and giving back all the Zeta owned by the contract)
         */
    }
}
