import { MaxUint256 } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { bytecode } from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";
import bn from "bignumber.js";
import { BigNumber, BigNumberish } from "ethers";
import { utils } from "ethers";
import { ethers } from "hardhat";

import {
  IERC20,
  IERC20__factory,
  IPoolInitializer__factory,
  IUniswapV3Pool__factory,
  IWETH9__factory,
} from "../typechain-types";

export const getNow = async () => {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
};

const GAS_LIMIT = 6000000;

bn.config({ DECIMAL_PLACES: 40, EXPONENTIAL_AT: 999999 });

export const POOL_BYTECODE_HASH = utils.keccak256(bytecode);
export const MaxUint128 = BigNumber.from(2).pow(128).sub(1);

export enum FeeAmount {
  LOW = 500,
  MEDIUM = 3000,
  HIGH = 10000,
}

export const TICK_SPACINGS: { [amount in FeeAmount]: number } = {
  [FeeAmount.LOW]: 10,
  [FeeAmount.MEDIUM]: 60,
  [FeeAmount.HIGH]: 200,
};

// returns the sqrt price as a 64x96
export function encodePriceSqrt(reserve1: BigNumberish, reserve0: BigNumberish): BigNumber {
  return BigNumber.from(
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toString()
  );
}

export const getMinTick = (tickSpacing: number) => Math.ceil(-887272 / tickSpacing) * tickSpacing;
export const getMaxTick = (tickSpacing: number) => Math.floor(887272 / tickSpacing) * tickSpacing;
export const getMaxLiquidityPerTick = (tickSpacing: number) =>
  BigNumber.from(2)
    .pow(128)
    .sub(1)
    .div((getMaxTick(tickSpacing) - getMinTick(tickSpacing)) / tickSpacing + 1);

export function computePoolAddress(factoryAddress: string, [tokenA, tokenB]: [string, string], fee: number): string {
  const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];
  const constructorArgumentsEncoded = utils.defaultAbiCoder.encode(
    ["address", "address", "uint24"],
    [token0, token1, fee]
  );
  const create2Inputs = [
    "0xff",
    factoryAddress,
    // salt
    utils.keccak256(constructorArgumentsEncoded),
    // init code hash
    POOL_BYTECODE_HASH,
  ];
  const sanitizedInputs = `0x${create2Inputs.map((i) => i.slice(2)).join("")}`;
  return utils.getAddress(`0x${utils.keccak256(sanitizedInputs).slice(-40)}`);
}

export interface createPoolV3Params {
  ETHToAdd: BigNumber;
  WETHAddress: string;
  deployer: SignerWithAddress;
  uniswapFactoryV3Address: string;
  uniswapNFTManagerV3Address: string;
  zetaToAdd: BigNumber;
  zetaTokenAddress: string;
}

export const createZetaEthPoolUniV2 = async ({
  WETHAddress,
  uniswapFactoryV3Address,
  uniswapNFTManagerV3Address,
  zetaTokenAddress,
  zetaToAdd,
  ETHToAdd,
  deployer,
}: createPoolV3Params) => {
  const WETH = IERC20__factory.connect(WETHAddress, deployer);

  let tokens: [IERC20, IERC20] = [WETH, WETH];

  let tokenAddr0 = WETHAddress;
  let tokenAddr1 = zetaTokenAddress;

  if (tokenAddr1 < tokenAddr0) {
    const tokenAddrAux = tokenAddr0;
    tokenAddr0 = tokenAddr1;
    tokenAddr1 = tokenAddrAux;
  }

  tokens[0] = IERC20__factory.connect(tokenAddr0, deployer);
  const tx1 = await tokens[0].approve(uniswapNFTManagerV3Address, MaxUint256);
  await tx1.wait();

  tokens[1] = IERC20__factory.connect(tokenAddr1, deployer);
  const tx2 = await tokens[1].approve(uniswapNFTManagerV3Address, MaxUint256);
  await tx2.wait();

  const WETH9 = IWETH9__factory.connect(WETHAddress, deployer);
  await WETH9.deposit({ value: ETHToAdd });

  const factory = IUniswapV3Pool__factory.connect(uniswapFactoryV3Address, deployer);
  const nft = IPoolInitializer__factory.connect(uniswapNFTManagerV3Address, deployer);

  const expectedAddress = computePoolAddress(factory.address, [tokens[0].address, tokens[1].address], FeeAmount.MEDIUM);
  const code = await deployer.provider!.getCode(expectedAddress);

  // if code == '0x' means the pool it's not created yet
  if (code === "0x") {
    await nft.createAndInitializePoolIfNecessary(
      tokens[0].address,
      tokens[1].address,
      FeeAmount.MEDIUM,
      encodePriceSqrt(1, 1),
      { gasLimit: GAS_LIMIT }
    );
  }

  await nft.mint(
    {
      amount0Desired: tokens[0].address === WETHAddress ? ETHToAdd : zetaToAdd,
      amount0Min: 0,
      amount1Desired: tokens[1].address === WETHAddress ? ETHToAdd : zetaToAdd,
      amount1Min: 0,
      deadline: (await getNow()) + 360,
      fee: FeeAmount.MEDIUM,
      recipient: deployer.address,
      tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
      tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
      token0: tokens[0].address,
      token1: tokens[1].address,
    },
    { gasLimit: GAS_LIMIT }
  );
};
