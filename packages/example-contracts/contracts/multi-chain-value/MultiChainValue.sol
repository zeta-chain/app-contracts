// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/Zeta.eth.sol";
import "@zetachain/protocol-contracts/contracts/interfaces/ZetaInterfaces.sol";

contract MultiChainValue is Ownable {
    address public zetaConnector;
    address public zetaToken;
    ZetaConnector internal connector;

    mapping(uint256 => bool) public availableChainIds;

    constructor(address zetaConnector_, address zetaToken_) {
        zetaConnector = zetaConnector_;
        zetaToken = zetaToken_;
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
        uint256 zetaValueAndGas
    ) external {
        require(availableChainIds[destinationChainId], "MultiChainValue: destinationChainId not available");
        require(zetaValueAndGas != 0, "MultiChainValue: zetaValueAndGas should be greater than 0");

        bool success1 = ZetaEth(zetaToken).approve(zetaConnector, zetaValueAndGas);
        bool success2 = ZetaEth(zetaToken).transferFrom(msg.sender, address(this), zetaValueAndGas);
        require((success1 && success2) == true, "MultiChainValue: error transferring Zeta");

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: destinationAddress,
                destinationGasLimit: 300000,
                message: abi.encode(),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }
}
