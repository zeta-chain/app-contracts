import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";

import { IUniswapV2Factory__factory } from "../../typechain-types";
import { ERC20, IUniswapV2Pair__factory } from "../../typechain-types";

export interface Pair {
  TokenA: string;
  TokenB: string;
}

export const getNow = async () => {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
};

export const sortPair = (token1: string, token2: string): Pair => {
  if (token1 < token2) {
    return { TokenA: token1, TokenB: token2 };
  }
  return { TokenA: token2, TokenB: token1 };
};

export const printReserves = async (
  tokenContract: ERC20,
  WZETAAddress: string,
  uniswapFactoryAddress: string,
  deployer: SignerWithAddress
) => {
  const uniswapV2Factory = IUniswapV2Factory__factory.connect(uniswapFactoryAddress, deployer);

  const pair = sortPair(tokenContract.address, WZETAAddress);

  const poolAddress = await uniswapV2Factory.getPair(pair.TokenA, pair.TokenB);

  const pool = IUniswapV2Pair__factory.connect(poolAddress, deployer);

  const reserves = await pool.getReserves();

  const reservesZETA = WZETAAddress < tokenContract.address ? reserves.reserve0 : reserves.reserve1;
  const reservesToken = WZETAAddress > tokenContract.address ? reserves.reserve0 : reserves.reserve1;

  const tokenDecimals = await tokenContract.decimals();
  const reservesToken18Decimals =
    18 === tokenDecimals ? reservesToken : reservesToken.mul(parseUnits("1", 18 - tokenDecimals));

  const ratio = reservesToken18Decimals.mul(parseUnits("1")).div(reservesZETA);

  console.log(
    `Reserves ZETA: ${formatUnits(reservesZETA)} / TOKEN: ${formatUnits(reservesToken18Decimals)} / Ratio ${formatUnits(
      ratio
    )}`
  );
};
