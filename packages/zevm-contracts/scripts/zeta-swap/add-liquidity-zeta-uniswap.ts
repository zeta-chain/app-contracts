import { MaxUint256 } from "@ethersproject/constants";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getChainId } from "@zetachain/addresses";
import { NetworkName } from "@zetachain/addresses";
import { getAddress } from "@zetachain/addresses";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import {
  ERC20__factory,
  IUniswapV2Factory__factory,
  IUniswapV2Pair__factory,
  IUniswapV2Router02,
  SystemContract__factory,
  UniswapV2Router02,
  UniswapV2Router02__factory
} from "../../typechain-types";
import { SYSTEM_CONTRACT } from "../systemConstants";

const ZETA_TO_ADD = parseUnits("0");

interface Pair {
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

const addTokenEthLiquidity = async (
  tokenAddress: string,
  tokenToAdd: BigNumber,
  ETHToAdd: BigNumber,
  uniswapRouter: IUniswapV2Router02,
  deployer: SignerWithAddress
) => {
  const TokenContract = ERC20__factory.connect(tokenAddress, deployer);

  const tx1 = await TokenContract.approve(uniswapRouter.address, MaxUint256);
  await tx1.wait();

  const tx2 = await uniswapRouter.addLiquidityETH(
    TokenContract.address,
    tokenToAdd,
    0,
    0,
    deployer.address,
    (await getNow()) + 360,
    { gasLimit: 10_000_000, value: ETHToAdd }
  );
  await tx2.wait();
};

const estimateZetaForToken = async (
  tokenAddress: string,
  tokenToAdd: BigNumber,
  uniswapRouter: IUniswapV2Router02,
  deployer: SignerWithAddress
) => {
  const WZETA_ADDRESS = getAddress({
    address: "weth9",
    networkName: "athens",
    zetaNetwork: "athens"
  });

  const UNISWAP_FACTORY_ADDRESS = getAddress({
    address: "uniswapV2Factory",
    networkName: "athens",
    zetaNetwork: "athens"
  });

  const uniswapV2Factory = IUniswapV2Factory__factory.connect(UNISWAP_FACTORY_ADDRESS, deployer);

  const pair = sortPair(tokenAddress, WZETA_ADDRESS);

  const poolAddress = await uniswapV2Factory.getPair(pair.TokenA, pair.TokenB);

  const pool = IUniswapV2Pair__factory.connect(poolAddress, deployer);

  const reserves = await pool.getReserves();

  const reservesZETA = WZETA_ADDRESS < tokenAddress ? reserves.reserve0 : reserves.reserve1;
  const reservesToken = WZETA_ADDRESS > tokenAddress ? reserves.reserve0 : reserves.reserve1;
  const ZETAValue = await uniswapRouter.quote(tokenToAdd, reservesZETA, reservesToken);
  console.log(`Zeta/Token reserves ${formatUnits(reservesZETA)}/${formatUnits(reservesToken)}`);
  return ZETAValue;
};

async function addLiquidity(network: NetworkName, tokenAmountToAdd: BigNumber) {
  const initLiquidityPool = !ZETA_TO_ADD.isZero();

  const [deployer] = await ethers.getSigners();

  const UNISWAP_ROUTER_ADDRESS = getAddress({
    address: "uniswapV2Router02",
    networkName: "athens",
    zetaNetwork: "athens"
  });

  const systemContract = await SystemContract__factory.connect(SYSTEM_CONTRACT, deployer);

  const tokenAddress = await systemContract.gasCoinZRC20ByChainId(getChainId(network));

  const uniswapRouter = await UniswapV2Router02__factory.connect(UNISWAP_ROUTER_ADDRESS, deployer);

  const zetaToAdd = initLiquidityPool
    ? ZETA_TO_ADD
    : await estimateZetaForToken(tokenAddress, tokenAmountToAdd, uniswapRouter, deployer);

  console.log(`Zeta/Token to add ${formatUnits(zetaToAdd)}/${formatUnits(tokenAmountToAdd)}`);
  await addTokenEthLiquidity(tokenAddress, tokenAmountToAdd, zetaToAdd, uniswapRouter, deployer);
}
async function main() {
  await addLiquidity("goerli", parseUnits("20", 18));
  await addLiquidity("polygon-mumbai", parseUnits("20", 18));
  await addLiquidity("bsc-testnet", parseUnits("20", 18));
  // await addLiquidity("bitcoin-test", parseUnits("0.002", 8));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
