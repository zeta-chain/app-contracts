// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

import "./interfaces/ZetaErrors.sol";

import "./interfaces/ZetaNonEthInterface.sol";

contract ZetaNonEth is ZetaNonEthInterface, ERC20Burnable, ZetaErrors {
    address public connectorAddress;

    /**
     * @dev Collectively held by Zeta blockchain validators
     */
    address public tssAddress;

    /**
     * @dev Initially a multi-sig, eventually held by Zeta blockchain validators (via renounceTssAddressUpdater)
     */
    address public tssAddressUpdater;

    event Minted(address indexed mintee, uint256 amount, bytes32 indexed internalSendHash);

    event Burnt(address indexed burnee, uint256 amount);

    constructor(address tssAddress_, address tssAddressUpdater_) ERC20("Zeta", "ZETA") {
        if (tssAddress_ == address(0) || tssAddressUpdater_ == address(0)) revert InvalidAddress();

        tssAddress = tssAddress_;
        tssAddressUpdater = tssAddressUpdater_;
    }

    function updateTssAndConnectorAddresses(address tssAddress_, address connectorAddress_) external {
        if (msg.sender != tssAddressUpdater && msg.sender != tssAddress) revert CallerIsNotTssOrUpdater(msg.sender);
        if (tssAddress_ == address(0) || connectorAddress_ == address(0)) revert InvalidAddress();

        tssAddress = tssAddress_;
        connectorAddress = connectorAddress_;
    }

    /**
     * @dev Sets tssAddressUpdater to be tssAddress
     */
    function renounceTssAddressUpdater() external {
        if (msg.sender != tssAddressUpdater) revert CallerIsNotTssUpdater(msg.sender);
        if (tssAddress == address(0)) revert InvalidAddress();

        tssAddressUpdater = tssAddress;
    }

    function mint(address mintee, uint256 value, bytes32 internalSendHash) external override {
        /**
         * @dev Only Connector can mint. Minting requires burning the equivalent amount on another chain
         */
        if (msg.sender != connectorAddress) revert CallerIsNotConnector(msg.sender);

        _mint(mintee, value);

        emit Minted(mintee, value, internalSendHash);
    }

    function burnFrom(address account, uint256 amount) public override(ZetaNonEthInterface, ERC20Burnable) {
        /**
         * @dev Only Connector can burn.
         */
        if (msg.sender != connectorAddress) revert CallerIsNotConnector(msg.sender);

        ERC20Burnable.burnFrom(account, amount);

        emit Burnt(account, amount);
    }
}
