import { MaxUint256 } from "@ethersproject/constants";
import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getNonZetaAddress, isProtocolNetworkName, ZetaProtocolNetwork } from "@zetachain/protocol-contracts";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

import {
  ERC20,
  ERC20__factory,
  IUniswapV2Factory__factory,
  IUniswapV2Pair__factory,
  IUniswapV2Router02,
  SystemContract__factory,
  UniswapV2Router02__factory,
} from "../../typechain-types";
import { getChainId, getSystemContractAddress } from "../address.helpers";
import { getNow, printReserves, sortPair } from "./uniswap.helpers";

const networkName = network.name;

const SYSTEM_CONTRACT = getSystemContractAddress();

const BTC_TO_ADD = parseUnits("0", 8);
const ETH_TO_ADD = parseUnits("0");
const MATIC_TO_ADD = parseUnits("0");
const BNB_TO_ADD = parseUnits("0");

const ZETA_TO_ADD = parseUnits("0");

const addTokenEthLiquidity = async (
  tokenContract: ERC20,
  tokenAmountToAdd: BigNumber,
  ETHToAdd: BigNumber,
  uniswapRouter: IUniswapV2Router02,
  deployer: SignerWithAddress
) => {
  const tx1 = await tokenContract.approve(uniswapRouter.address, MaxUint256);
  await tx1.wait();

  console.log("Uniswap approved to consume token...");

  const tx2 = await uniswapRouter.addLiquidityETH(
    tokenContract.address,
    tokenAmountToAdd,
    0,
    0,
    deployer.address,
    (await getNow()) + 360,
    { gasLimit: 10_000_000, value: ETHToAdd }
  );
  await tx2.wait();
};

const estimateZetaForToken = async (
  WZETAAddress: string,
  uniswapFactoryAddress: string,
  tokenContract: ERC20,
  tokenAmountToAdd: BigNumber,
  deployer: SignerWithAddress
) => {
  const uniswapV2Factory = IUniswapV2Factory__factory.connect(uniswapFactoryAddress, deployer);

  const pair = sortPair(tokenContract.address, WZETAAddress);

  const poolAddress = await uniswapV2Factory.getPair(pair.TokenA, pair.TokenB);

  const pool = IUniswapV2Pair__factory.connect(poolAddress, deployer);

  const reserves = await pool.getReserves();

  const reservesZETA = WZETAAddress < tokenContract.address ? reserves.reserve0 : reserves.reserve1;
  const reservesToken = WZETAAddress > tokenContract.address ? reserves.reserve0 : reserves.reserve1;

  const ZETAValue = reservesZETA.mul(tokenAmountToAdd).div(reservesToken);

  return ZETAValue;
};

async function addLiquidity(
  network: ZetaProtocolNetwork,
  tokenAmountToAdd: BigNumber,
  WZETAAddress: string,
  uniswapFactoryAddress: string,
  uniswapRouterAddress: string
) {
  console.log(`Adding liquidity for: ${network}`);
  const initLiquidityPool = !ZETA_TO_ADD.isZero();

  const [deployer] = await ethers.getSigners();

  const systemContract = await SystemContract__factory.connect(SYSTEM_CONTRACT, deployer);
  const uniswapRouter = await UniswapV2Router02__factory.connect(uniswapRouterAddress, deployer);

  const tokenAddress = await systemContract.gasCoinZRC20ByChainId(getChainId(network));
  const tokenContract = ERC20__factory.connect(tokenAddress, deployer);

  const zetaToAdd = initLiquidityPool
    ? ZETA_TO_ADD
    : await estimateZetaForToken(WZETAAddress, uniswapFactoryAddress, tokenContract, tokenAmountToAdd, deployer);

  await printReserves(tokenContract, WZETAAddress, uniswapFactoryAddress, deployer);
  // await addTokenEthLiquidity(tokenContract, tokenAmountToAdd, zetaToAdd, uniswapRouter, deployer);
  await printReserves(tokenContract, WZETAAddress, uniswapFactoryAddress, deployer);
}
async function main() {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  const WZETA_ADDRESS = getNonZetaAddress("weth9", networkName);

  const UNISWAP_FACTORY_ADDRESS = getNonZetaAddress("uniswapV2Factory", networkName);

  const UNISWAP_ROUTER_ADDRESS = getNonZetaAddress("uniswapV2Router02", networkName);

  if (!ETH_TO_ADD.isZero()) {
    await addLiquidity("goerli_testnet", ETH_TO_ADD, WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  }
  if (!MATIC_TO_ADD.isZero()) {
    await addLiquidity("mumbai_testnet", MATIC_TO_ADD, WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  }
  if (!BNB_TO_ADD.isZero()) {
    await addLiquidity("bsc_testnet", BNB_TO_ADD, WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  }
  if (!BTC_TO_ADD.isZero()) {
    await addLiquidity("btc_testnet", BTC_TO_ADD, WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
