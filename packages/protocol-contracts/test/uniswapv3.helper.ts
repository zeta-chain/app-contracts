import { MaxUint256 } from "@ethersproject/constants";
import { parseEther } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { bytecode } from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";
import { getAddress } from "@zetachain/addresses";
import bn from "bignumber.js";
import { BigNumber, BigNumberish } from "ethers";
import { utils } from "ethers";

import {
  IERC20,
  IERC20__factory,
  IPoolInitializer__factory,
  IUniswapV3Pool__factory,
  IWETH9__factory,
} from "../typechain-types";

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

export const createPoolV3 = async (
  zetaTokenAddress: string,
  zetaToAdd: BigNumber,
  ETHToAdd: BigNumber,
  deployer: SignerWithAddress
) => {
  const WETHAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH MAINNET
  const WETH = IERC20__factory.connect(WETHAddr, deployer);

  let tokens: [IERC20, IERC20] = [WETH, WETH];

  const UNI_NFT_MANAGER_V3 = getAddress("uniswapV3NftManager", {
    customNetworkName: "eth-mainnet",
    customZetaNetwork: "mainnet",
  });

  const UNI_FACTORY_V3 = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

  let tokenAddr0 = WETHAddr;
  let tokenAddr1 = zetaTokenAddress;

  if (tokenAddr1 < tokenAddr0) {
    const tokenAddrAux = tokenAddr0;
    tokenAddr0 = tokenAddr1;
    tokenAddr1 = tokenAddrAux;
  }

  tokens[0] = IERC20__factory.connect(tokenAddr0, deployer);
  const tx1 = await tokens[0].approve(UNI_NFT_MANAGER_V3, MaxUint256);
  await tx1.wait();

  tokens[1] = IERC20__factory.connect(tokenAddr1, deployer);
  const tx2 = await tokens[1].approve(UNI_NFT_MANAGER_V3, MaxUint256);
  await tx2.wait();

  const WETH9 = IWETH9__factory.connect(WETHAddr, deployer);
  await WETH9.deposit({ value: ETHToAdd });

  const factory = IUniswapV3Pool__factory.connect(UNI_FACTORY_V3, deployer);
  const nft = IPoolInitializer__factory.connect(UNI_NFT_MANAGER_V3, deployer);

  const expectedAddress = computePoolAddress(factory.address, [tokens[0].address, tokens[1].address], FeeAmount.MEDIUM);
  const codeAfter = await deployer.provider!.getCode(expectedAddress);
  // expect(codeAfter).to.not.eq("0x");
  // if != 0x pool already exist

  await nft.createAndInitializePoolIfNecessary(
    tokens[0].address,
    tokens[1].address,
    FeeAmount.MEDIUM,
    encodePriceSqrt(1, 1),
    { gasLimit: 6000000 }
  );

  nft.mint({
    amount0Desired: tokens[0].address === WETHAddr ? ETHToAdd : zetaToAdd,
    amount0Min: 0,
    amount1Desired: tokens[1].address === WETHAddr ? ETHToAdd : zetaToAdd,
    amount1Min: 0,
    deadline: 1,
    fee: FeeAmount.MEDIUM,
    recipient: deployer.address,
    tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
    tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
    token0: tokens[0].address,
    token1: tokens[1].address,
  });
};
