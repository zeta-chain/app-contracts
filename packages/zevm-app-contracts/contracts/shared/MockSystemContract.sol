// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";

interface SystemContractErrors {
    error CallerIsNotFungibleModule();

    error InvalidTarget();

    error CantBeIdenticalAddresses();

    error CantBeZeroAddress();
}

contract MockSystemContract is SystemContractErrors {
    error TransferFailed();

    mapping(uint256 => uint256) public gasPriceByChainId;
    mapping(uint256 => address) public gasCoinZRC20ByChainId;
    mapping(uint256 => address) public gasZetaPoolByChainId;

    address public wZetaContractAddress;
    address public immutable uniswapv2FactoryAddress;
    address public immutable uniswapv2Router02Address;

    event SystemContractDeployed();
    event SetGasPrice(uint256, uint256);
    event SetGasCoin(uint256, address);
    event SetGasZetaPool(uint256, address);
    event SetWZeta(address);

    constructor(address wzeta_, address uniswapv2Factory_, address uniswapv2Router02_) {
        wZetaContractAddress = wzeta_;
        uniswapv2FactoryAddress = uniswapv2Factory_;
        uniswapv2Router02Address = uniswapv2Router02_;
        emit SystemContractDeployed();
    }

    // fungible module updates the gas price oracle periodically
    function setGasPrice(uint256 chainID, uint256 price) external {
        gasPriceByChainId[chainID] = price;
        emit SetGasPrice(chainID, price);
    }

    function setGasCoinZRC20(uint256 chainID, address zrc20) external {
        gasCoinZRC20ByChainId[chainID] = zrc20;
        emit SetGasCoin(chainID, zrc20);
    }

    function setWZETAContractAddress(address addr) external {
        wZetaContractAddress = addr;
        emit SetWZeta(wZetaContractAddress);
    }

    // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        if (tokenA == tokenB) revert CantBeIdenticalAddresses();
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        if (token0 == address(0)) revert CantBeZeroAddress();
    }

    function uniswapv2PairFor(address factory, address tokenA, address tokenB) public pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            hex"ff",
                            factory,
                            keccak256(abi.encodePacked(token0, token1)),
                            hex"96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f" // init code hash
                        )
                    )
                )
            )
        );
    }

    function onCrossChainCall(address target, address zrc20, uint256 amount, bytes calldata message) external {
        zContext memory context = zContext({sender: msg.sender, origin: "", chainID: block.chainid});
        bool transfer = IZRC20(zrc20).transfer(target, amount);
        if (!transfer) revert TransferFailed();
        zContract(target).onCrossChainCall(context, zrc20, amount, message);
    }
}
