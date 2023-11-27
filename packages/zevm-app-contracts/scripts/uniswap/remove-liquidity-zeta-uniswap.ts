import { MaxUint256 } from "@ethersproject/constants";
import { formatUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getNonZetaAddress, isProtocolNetworkName, ZetaProtocolNetwork } from "@zetachain/protocol-contracts";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

import {
  ERC20,
  ERC20__factory,
  IUniswapV2Factory__factory,
  IUniswapV2Pair,
  IUniswapV2Pair__factory,
  IUniswapV2Router02,
  SystemContract__factory,
  UniswapV2Router02__factory
} from "../../typechain-types";
import { getChainId, getSystemContractAddress } from "../address.helpers";
import { getNow, printReserves, sortPair } from "./uniswap.helpers";

const networkName = network.name;
const SYSTEM_CONTRACT = getSystemContractAddress();

const removeTokenEthLiquidity = async (
  tokenContract: ERC20,
  LPContract: IUniswapV2Pair,
  LPAmountToRemove: BigNumber,
  uniswapRouter: IUniswapV2Router02,
  deployer: SignerWithAddress
) => {
  const tx1 = await LPContract.approve(uniswapRouter.address, MaxUint256);
  await tx1.wait();

  console.log("Uniswap approved to consume LP...");

  const tx2 = await uniswapRouter.removeLiquidityETH(
    tokenContract.address,
    LPAmountToRemove,
    0,
    0,
    deployer.address,
    (await getNow()) + 360,
    { gasLimit: 10_000_000 }
  );
  await tx2.wait();
};

async function removeLiquidity(
  network: ZetaProtocolNetwork,
  WZETAAddress: string,
  uniswapFactoryAddress: string,
  uniswapRouterAddress: string
) {
  console.log(`Removing liquidity for: ${network}`);

  const [deployer] = await ethers.getSigners();

  const systemContract = await SystemContract__factory.connect(SYSTEM_CONTRACT, deployer);
  const uniswapV2Factory = IUniswapV2Factory__factory.connect(uniswapFactoryAddress, deployer);
  const uniswapRouter = await UniswapV2Router02__factory.connect(uniswapRouterAddress, deployer);

  const tokenAddress = await systemContract.gasCoinZRC20ByChainId(getChainId(network));
  const tokenContract = ERC20__factory.connect(tokenAddress, deployer);

  const pair = sortPair(tokenAddress, WZETAAddress);

  const poolAddress = await uniswapV2Factory.getPair(pair.TokenA, pair.TokenB);

  const pool = IUniswapV2Pair__factory.connect(poolAddress, deployer);

  const LPBalance = await pool.balanceOf(deployer.address);

  console.log(`LP Balance: ${formatUnits(LPBalance, 18)} for ${poolAddress}`);

  await printReserves(tokenContract, WZETAAddress, uniswapFactoryAddress, deployer);
  // await removeTokenEthLiquidity(tokenContract, pool, LPBalance, uniswapRouter, deployer);
  await printReserves(tokenContract, WZETAAddress, uniswapFactoryAddress, deployer);
}
async function main() {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const WZETA_ADDRESS = getNonZetaAddress("weth9", networkName);

  const UNISWAP_FACTORY_ADDRESS = getNonZetaAddress("uniswapV2Factory", networkName);

  const UNISWAP_ROUTER_ADDRESS = getNonZetaAddress("uniswapV2Router02", networkName);

  await removeLiquidity("goerli_testnet", WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  await removeLiquidity("mumbai_testnet", WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  await removeLiquidity("bsc_testnet", WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  await removeLiquidity("btc_testnet", WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
