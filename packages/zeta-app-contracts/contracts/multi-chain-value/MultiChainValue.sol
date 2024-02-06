// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/evm/Zeta.eth.sol";
import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";
import "../shared/IWZeta.sol";

/**
 * @dev Custom errors for contract MultiChainValue
 */
interface MultiChainValueErrors {
    error ErrorTransferringZeta();

    error ChainIdAlreadyEnabled();

    error ChainIdNotAvailable();

    error InvalidZetaValueAndGas();
}

/**
 * @dev MultiChainValue goal is to send Zeta token across all supported chains
 * Extends the logic defined in ZetaInteractor to handle multichain standards
 */
contract MultiChainValue is ZetaInteractor, MultiChainValueErrors {
    address public zetaToken;
    // @dev map of valid chains to send Zeta
    mapping(uint256 => bool) public availableChainIds;

    // @dev Constructor calls ZetaInteractor's constructor to setup Connector address and current chain
    constructor(address connectorAddress_, address zetaToken_) ZetaInteractor(connectorAddress_) {
        if (zetaToken_ == address(0)) revert ZetaCommonErrors.InvalidAddress();
        zetaToken = zetaToken_;
    }

    /**
     * @dev Whitelist a chain to send Zeta
     */
    function addAvailableChainId(uint256 destinationChainId) external onlyOwner {
        if (availableChainIds[destinationChainId]) revert ChainIdAlreadyEnabled();

        availableChainIds[destinationChainId] = true;
    }

    /**
     * @dev Blacklist a chain to send Zeta
     */
    function removeAvailableChainId(uint256 destinationChainId) external onlyOwner {
        if (!availableChainIds[destinationChainId]) revert ChainIdNotAvailable();

        delete availableChainIds[destinationChainId];
    }

    /**
     * @dev If the destination chain is a valid chain, send the Zeta tokens to that chain
     */
    function sendZeta(uint256 destinationChainId, bytes calldata destinationAddress) public payable {
        uint256 zetaValueAndGas = msg.value;

        if (!availableChainIds[destinationChainId]) revert InvalidDestinationChainId();
        if (zetaValueAndGas == 0) revert InvalidZetaValueAndGas();

        IWZeta(zetaToken).deposit{value: zetaValueAndGas}();
        bool success1 = ZetaEth(zetaToken).approve(address(connector), zetaValueAndGas);
        if (!success1) revert ErrorTransferringZeta();

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: destinationAddress,
                destinationGasLimit: 300000,
                message: abi.encode(msg.sender),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    /**
     * @dev If the destination chain is a valid chain, send the Zeta tokens to that chain
     */
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

    function onZetaRevert(ZetaInterfaces.ZetaRevert calldata zetaRevert) external isValidRevertCall(zetaRevert) {
        //@dev this version do not handle revert
    }
}
