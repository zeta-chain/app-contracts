// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/ZetaEth.sol";
import "@zetachain/protocol-contracts/contracts/interfaces/ZetaInterfaces.sol";

contract MultiChainValue is Ownable {
    address public zetaConnector;
    address public zetaToken;
    ZetaConnector internal connector;

    mapping(uint256 => bool) public availableChainIds;

    constructor(address zetaConnector_, address zetaTokenInput_) {
        zetaConnector = zetaConnector_;
        zetaToken = zetaTokenInput_;
        connector = ZetaConnector(zetaConnector_);
    }

    function addAvailableChainId(uint256 destinationChainId) external onlyOwner {
        require(!availableChainIds[destinationChainId], "MultiChainValue: destinationChainId already enabled");

        availableChainIds[destinationChainId] = true;
    }

    function removeAvailableChainId(uint256 destinationChainId) external onlyOwner {
        require(availableChainIds[destinationChainId], "MultiChainValue: destinationChainId not available");

        delete availableChainIds[destinationChainId];
    }

    function send(
        uint256 destinationChainId,
        bytes calldata destinationAddress,
        uint256 zetaAmount
    ) external {
        require(availableChainIds[destinationChainId], "MultiChainValue: destinationChainId not available");
        require(zetaAmount != 0, "MultiChainValue: zetaAmount should be greater than 0");

        bool success1 = ZetaEth(zetaToken).approve(zetaConnector, zetaAmount);
        bool success2 = ZetaEth(zetaToken).transferFrom(msg.sender, address(this), zetaAmount);
        require((success1 && success2) == true, "MultiChainValue: error transferring Zeta");

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: destinationAddress,
                destinationGasLimit: 300000,
                message: abi.encode(),
                zetaAmount: zetaAmount,
                zetaParams: abi.encode("")
            })
        );
    }
}
