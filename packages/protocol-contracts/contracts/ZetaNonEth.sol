/* solhint-disable var-name-mixedcase */
// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./ZetaNonEthErrors.sol";

contract ZetaNonEth is ERC20Burnable, ZetaNonEthErrors {
    /**
     * @dev Collectively hold by Zeta blockchain validators
     */
    address public TSSAddress;

    /**
     * @dev Initially a multi-sig, eventually hold by Zeta blockchain validators (via renounceTSSAddressUpdater)
     */
    address public TSSAddressUpdater;

    address public connectorAddress;

    event MMinted(address indexed mintee, uint256 amount, bytes32 indexed internalSendHash);
    event MBurnt(address indexed burnee, uint256 amount);

    constructor(
        uint256 initialSupply,
        address TSSAddress_,
        address TSSAddressUpdater_
    ) ERC20("Zeta", "ZETA") {
        if (TSSAddress_ == address(0) || TSSAddressUpdater_ == address(0)) revert AddressCantBeZero();
        _mint(msg.sender, initialSupply * (10**uint256(decimals())));

        TSSAddress = TSSAddress_;
        TSSAddressUpdater = TSSAddressUpdater_;
    }

    function updateTSSAndConnectorAddresses(address _tss, address _connectorAddress) external {
        if (msg.sender != TSSAddressUpdater) revert InvalidCaller(TSSAddressUpdater, msg.sender);
        if (_tss == address(0) || _connectorAddress == address(0)) revert AddressCantBeZero();

        TSSAddress = _tss;
        connectorAddress = _connectorAddress;
    }

    /**
     * @dev Sets TSSAddressUpdater to be TSSAddress
     */
    function renounceTSSAddressUpdater() external {
        if (msg.sender != TSSAddressUpdater) revert InvalidCaller(TSSAddressUpdater, msg.sender);
        if (TSSAddress == address(0)) revert AddressCantBeZero();

        TSSAddressUpdater = TSSAddress;
    }

    function mint(
        address mintee,
        uint256 value,
        bytes32 internalSendHash
    ) external {
        /**
         * @dev Only Connector or TSS can mint since minting requires burning the equivalent in another chain
         */
        if (msg.sender != TSSAddress && msg.sender != connectorAddress) revert InvalidMinter(msg.sender);

        _mint(mintee, value);

        emit MMinted(mintee, value, internalSendHash);
    }
}
/* solhint-enable var-name-mixedcase */
