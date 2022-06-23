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
        uint256 originChainId,
        address destinationAddress,
        uint256 zetaAmount,
        bytes calldata message
    ) public {
        return
            MultiChainSwapBase(payable(destinationAddress)).onZetaMessage(
                ZetaInterfaces.ZetaMessage({
                    zetaTxSenderAddress: zetaTxSenderAddress,
                    originChainId: originChainId,
                    destinationAddress: destinationAddress,
                    zetaAmount: zetaAmount,
                    message: message
                })
            );
    }

    function callOnZetaRevert(
        address zetaTxSenderAddress,
        uint256 originChainId,
        uint256 destinationChainId,
        bytes calldata destinationAddress,
        uint256 zetaAmount,
        uint256, // destinationGasLimit
        bytes calldata message
    ) public {
        return
            MultiChainSwapBase(payable(zetaTxSenderAddress)).onZetaRevert(
                ZetaInterfaces.ZetaRevert({
                    zetaTxSenderAddress: zetaTxSenderAddress,
                    originChainId: originChainId,
                    destinationAddress: destinationAddress,
                    destinationChainId: destinationChainId,
                    zetaAmount: zetaAmount,
                    message: message
                })
            );
    }

    function send(ZetaInterfaces.SendInput calldata sendInput) external override {
        uint256 originChainId = sendInput.destinationChainId == 2 ? 1 : 2;
        address dest = address(uint160(bytes20(sendInput.destinationAddress)));

        if (sendInput.zetaAmount > 0) {
            bool success = IERC20(zetaToken).transferFrom(msg.sender, dest, sendInput.zetaAmount);
            require(success == true, "MultiChainSwap: error transferring token");
        }

        return
            callOnZetaMessage(
                abi.encodePacked(msg.sender),
                originChainId,
                dest,
                sendInput.zetaAmount,
                sendInput.message
            );
    }
}
