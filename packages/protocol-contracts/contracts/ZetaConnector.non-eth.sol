// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./ZetaConnector.base.sol";
import "./interfaces/ZetaInterfaces.sol";
import "./interfaces/ZetaNonEthInterface.sol";

contract ZetaConnectorNonEth is ZetaConnectorBase {
    uint256 public maxSupply = 2**256 - 1;

    constructor(
        address zetaTokenAddress_,
        address tssAddress_,
        address tssAddressUpdater_,
        address pauserAddress_
    ) ZetaConnectorBase(zetaTokenAddress_, tssAddress_, tssAddressUpdater_, pauserAddress_) {}

    function getLockedAmount() external view returns (uint256) {
        return ZetaNonEthInterface(zetaToken).balanceOf(address(this));
    }

    function setMaxSupply(uint256 maxSupply_) external onlyTssAddress {
        maxSupply = maxSupply_;
    }

    function send(ZetaInterfaces.SendInput calldata input) external override whenNotPaused {
        ZetaNonEthInterface(zetaToken).burnFrom(msg.sender, input.zetaValueAndGas);

        emit ZetaSent(
            tx.origin,
            msg.sender,
            input.destinationChainId,
            input.destinationAddress,
            input.zetaValueAndGas,
            input.destinationGasLimit,
            input.message,
            input.zetaParams
        );
    }

    function onReceive(
        bytes calldata zetaTxSenderAddress,
        uint256 sourceChainId,
        address destinationAddress,
        uint256 zetaValueAndGas,
        bytes calldata message,
        bytes32 internalSendHash
    ) external override whenNotPaused onlyTssAddress {
        if (zetaValueAndGas + ZetaNonEthInterface(zetaToken).totalSupply() > maxSupply)
            revert ExceedsMaxSupply(maxSupply);
        ZetaNonEthInterface(zetaToken).mint(destinationAddress, zetaValueAndGas, internalSendHash);

        if (message.length > 0) {
            ZetaReceiver(destinationAddress).onZetaMessage(
                ZetaInterfaces.ZetaMessage(
                    zetaTxSenderAddress,
                    sourceChainId,
                    destinationAddress,
                    zetaValueAndGas,
                    message
                )
            );
        }

        emit ZetaReceived(
            zetaTxSenderAddress,
            sourceChainId,
            destinationAddress,
            zetaValueAndGas,
            message,
            internalSendHash
        );
    }

    function onRevert(
        address zetaTxSenderAddress,
        uint256 sourceChainId,
        bytes calldata destinationAddress,
        uint256 destinationChainId,
        uint256 zetaValueAndGas,
        bytes calldata message,
        bytes32 internalSendHash
    ) external override whenNotPaused onlyTssAddress {
        if (zetaValueAndGas + ZetaNonEthInterface(zetaToken).totalSupply() > maxSupply)
            revert ExceedsMaxSupply(maxSupply);
        ZetaNonEthInterface(zetaToken).mint(zetaTxSenderAddress, zetaValueAndGas, internalSendHash);

        if (message.length > 0) {
            ZetaReceiver(zetaTxSenderAddress).onZetaRevert(
                ZetaInterfaces.ZetaRevert(
                    zetaTxSenderAddress,
                    sourceChainId,
                    destinationAddress,
                    destinationChainId,
                    zetaValueAndGas,
                    message
                )
            );
        }

        emit ZetaReverted(
            zetaTxSenderAddress,
            sourceChainId,
            destinationChainId,
            destinationAddress,
            zetaValueAndGas,
            message,
            internalSendHash
        );
    }
}
