// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/interfaces/ZetaInterfaces.sol";

import "../MultiChainSwap.base.sol";

contract MultiChainSwapZetaConnector is ZetaConnector {
    address public zetaToken;

    constructor(address zetaToken_) {
        zetaToken = zetaToken_;
    }

    function callOnZetaMessage(
        bytes memory zetaTxSenderAddress,
        uint256 sourceChainId,
        address destinationAddress,
        uint256 zetaValue,
        bytes calldata message
    ) public {
        return
            MultiChainSwapBase(payable(destinationAddress)).onZetaMessage(
                ZetaInterfaces.ZetaMessage({
                    zetaTxSenderAddress: zetaTxSenderAddress,
                    sourceChainId: sourceChainId,
                    destinationAddress: destinationAddress,
                    zetaValue: zetaValue,
                    message: message
                })
            );
    }

    function callOnZetaRevert(
        address zetaTxSenderAddress,
        uint256 sourceChainId,
        uint256 destinationChainId,
        bytes calldata destinationAddress,
        uint256 remainingZetaValue,
        uint256, // destinationGasLimit
        bytes calldata message
    ) public {
        return
            MultiChainSwapBase(payable(zetaTxSenderAddress)).onZetaRevert(
                ZetaInterfaces.ZetaRevert({
                    zetaTxSenderAddress: zetaTxSenderAddress,
                    sourceChainId: sourceChainId,
                    destinationAddress: destinationAddress,
                    destinationChainId: destinationChainId,
                    remainingZetaValue: remainingZetaValue,
                    message: message
                })
            );
    }

    function send(ZetaInterfaces.SendInput calldata sendInput) external override {
        uint256 sourceChainId = sendInput.destinationChainId == 2 ? 1 : 2;
        address dest = address(uint160(bytes20(sendInput.destinationAddress)));

        if (sendInput.zetaValueAndGas > 0) {
            bool success = IERC20(zetaToken).transferFrom(msg.sender, dest, sendInput.zetaValueAndGas);
            require(success == true, "MultiChainSwap: error transferring token");
        }

        return
            callOnZetaMessage(
                abi.encodePacked(msg.sender),
                sourceChainId,
                dest,
                sendInput.zetaValueAndGas,
                sendInput.message
            );
    }
}
