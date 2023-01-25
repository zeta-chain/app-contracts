// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/Zeta.eth.sol";
import "@zetachain/protocol-contracts/contracts/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/interfaces/ZetaInterfaces.sol";

interface MultiChainValueErrors {
    error ErrorTransferringZeta();

    error ChainIdAlreadyEnabled();

    error ChainIdNotAvailable();

    error InvalidZetaValueAndGas();
}

contract MultiChainValue is ZetaInteractor, MultiChainValueErrors {
    address public zetaToken;
    mapping(uint256 => bool) public availableChainIds;

    constructor(address connectorAddress_, address zetaToken_) ZetaInteractor(connectorAddress_) {
        if (zetaToken_ == address(0)) revert ZetaCommonErrors.InvalidAddress();
        zetaToken = zetaToken_;
    }

    function addAvailableChainId(uint256 destinationChainId) external onlyOwner {
        if (availableChainIds[destinationChainId]) revert ChainIdAlreadyEnabled();

        availableChainIds[destinationChainId] = true;
    }

    function removeAvailableChainId(uint256 destinationChainId) external onlyOwner {
        if (!availableChainIds[destinationChainId]) revert ChainIdNotAvailable();

        delete availableChainIds[destinationChainId];
    }

    function send(uint256 destinationChainId, bytes calldata destinationAddress, uint256 zetaValueAndGas) external {
        if (!availableChainIds[destinationChainId]) revert InvalidDestinationChainId();
        if (zetaValueAndGas == 0) revert InvalidZetaValueAndGas();

        bool success1 = ZetaEth(zetaToken).approve(address(connector), zetaValueAndGas);
        bool success2 = ZetaEth(zetaToken).transferFrom(msg.sender, address(this), zetaValueAndGas);
        if (!(success1 && success2)) revert ErrorTransferringZeta();

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
