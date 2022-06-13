// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/ZetaEth.sol";
import "@zetachain/protocol-contracts/contracts/ZetaInterfaces.sol";

contract MultiChainValue is ZetaInteractor {
    address public zetaToken;

    constructor(address connectorAddress_, address zetaTokenInput_) ZetaInteractor(connectorAddress_) {
        zetaToken = zetaTokenInput_;
    }

    function removeAvailableChainId(uint256 destinationChainId) external onlyOwner {
        require(isValidChainId(destinationChainId), "MultiChainValue: destinationChainId not available");

        delete interactorsByChainId[destinationChainId];
    }

    function send(
        uint256 destinationChainId,
        bytes calldata destinationAddress,
        uint256 zetaAmount
    ) external {
        require(isValidChainId(destinationChainId), "MultiChainValue: destinationChainId not available");
        require(zetaAmount != 0, "MultiChainValue: zetaAmount should be greater than 0");

        bool success1 = ZetaEth(zetaToken).approve(address(connector), zetaAmount);
        bool success2 = ZetaEth(zetaToken).transferFrom(msg.sender, address(this), zetaAmount);
        require((success1 && success2) == true, "MultiChainValue: error transferring Zeta");

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: destinationAddress,
                gasLimit: 300000,
                message: abi.encode(),
                zetaAmount: zetaAmount,
                zetaParams: abi.encode("")
            })
        );
    }
}
