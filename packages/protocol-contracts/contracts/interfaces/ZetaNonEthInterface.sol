// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @dev ZetaNonEthInterface is a mintable / burnable version of IERC20
 */
interface ZetaNonEthInterface is IERC20 {
    function burnFrom(address account, uint256 amount) external;

    function mint(address mintee, uint256 value, bytes32 internalSendHash) external;
}
