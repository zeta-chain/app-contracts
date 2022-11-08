// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "../interfaces/zContract.sol";
import "../interfaces/IZRC4.sol";

interface SystemContractErrors {
    error CallerIsNotFungibleModule();

    error InvalidTarget();

    error CantBeIdenticalAddresses();

    error CantBeZeroAddress();
}

contract SystemContract is SystemContractErrors {
    mapping(uint256 => uint256) public gasPriceByChainId;
    mapping(uint256 => address) public gasCoinZRC4ByChainId;
    mapping(uint256 => address) public gasZetaPoolByChainId;

    address public constant FUNGIBLE_MODULE_ADDRESS = 0x735b14BB79463307AAcBED86DAf3322B1e6226aB;
    address public wZetaContractAddress;
    address public uniswapv2FactoryAddress;
    address public uniswapv2Router02Address;

    event SystemContractDeployed();
    event SetGasPrice(uint256, uint256);
    event SetGasCoin(uint256, address);
    event SetGasZetaPool(uint256, address);
    event SetWZeta(address);

    constructor(
        address wzeta_,
        address uniswapv2Factory_,
        address uniswapv2Router02_
    ) {
        if (msg.sender != FUNGIBLE_MODULE_ADDRESS) revert CallerIsNotFungibleModule();
        wZetaContractAddress = wzeta_;
        uniswapv2FactoryAddress = uniswapv2Factory_;
        uniswapv2Router02Address = uniswapv2Router02_;
        emit SystemContractDeployed();
    }

    // deposit foreign coins into ZRC4 and call user specified contract on zEVM
    function depositAndCall(
        address zrc4,
        uint256 amount,
        address target,
        bytes calldata message
    ) external {
        if (msg.sender != FUNGIBLE_MODULE_ADDRESS) revert CallerIsNotFungibleModule();
        if (target == FUNGIBLE_MODULE_ADDRESS || target == address(this)) revert InvalidTarget();

        IZRC4(zrc4).deposit(target, amount);
        zContract(target).onCrossChainCall(zrc4, amount, message);
    }

    // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        if (tokenA == tokenB) revert CantBeIdenticalAddresses();
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        if (token0 == address(0)) revert CantBeZeroAddress();
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function uniswapv2PairFor(
        address factory,
        address tokenA,
        address tokenB
    ) public pure returns (address pair) {
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

    // fungible module updates the gas price oracle periodically
    function setGasPrice(uint256 chainID, uint256 price) external {
        if (msg.sender != FUNGIBLE_MODULE_ADDRESS) revert CallerIsNotFungibleModule();
        gasPriceByChainId[chainID] = price;
        emit SetGasPrice(chainID, price);
    }

    function setGasCoinZRC4(uint256 chainID, address zrc4) external {
        if (msg.sender != FUNGIBLE_MODULE_ADDRESS) revert CallerIsNotFungibleModule();
        gasCoinZRC4ByChainId[chainID] = zrc4;
        emit SetGasCoin(chainID, zrc4);
    }

    // set the pool wzeta/erc20 address
    function setGasZetaPool(uint256 chainID, address erc20) external {
        if (msg.sender != FUNGIBLE_MODULE_ADDRESS) revert CallerIsNotFungibleModule();
        address pool = uniswapv2PairFor(uniswapv2FactoryAddress, wZetaContractAddress, erc20);
        gasZetaPoolByChainId[chainID] = pool;
        emit SetGasZetaPool(chainID, pool);
    }

    function setWZETAContractAddress(address addr) external {
        if (msg.sender != FUNGIBLE_MODULE_ADDRESS) revert CallerIsNotFungibleModule();
        wZetaContractAddress = addr;
        emit SetWZeta(wZetaContractAddress);
    }
}
