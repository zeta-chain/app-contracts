import { MaxUint256 } from "@ethersproject/constants";
import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getNonZetaAddress, isProtocolNetworkName, ZetaProtocolNetwork } from "@zetachain/protocol-contracts";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

import {
  ERC20,
  ERC20__factory,
  IUniswapV2Router02,
  SystemContract__factory,
  UniswapV2Router02__factory,
} from "../../typechain-types";
import { getChainId, getSystemContractAddress } from "../address.helpers";
import { getNow, printReserves } from "./uniswap.helpers";

const networkName = network.name;
const SYSTEM_CONTRACT = getSystemContractAddress();

const BTC_TO_SELL = parseUnits("0", 8);
const ETH_TO_SELL = parseUnits("0");
const MATIC_TO_SELL = parseUnits("0");
const BNB_TO_SELL = parseUnits("0");

const swapZeta = async (
  tokenContract: ERC20,
  WZETAAddress: string,
  amountIn: BigNumber,
  uniswapRouter: IUniswapV2Router02,
  deployer: SignerWithAddress
) => {
  const tx1 = await tokenContract.approve(uniswapRouter.address, MaxUint256);
  await tx1.wait();

  console.log("Uniswap approved to consume token...");

  const tx2 = await uniswapRouter.swapExactTokensForETH(
    amountIn,
    0,
    [tokenContract.address, WZETAAddress],
    deployer.address,
    (await getNow()) + 360,
    { gasLimit: 10_000_000 }
  );
  await tx2.wait();

  console.log(`Tx hash: ${tx2.hash}`);
};

async function sellToken(
  network: ZetaProtocolNetwork,
  tokenAmountToSell: BigNumber,
  WZETAAddress: string,
  uniswapFactoryAddress: string,
  uniswapRouterAddress: string
) {
  console.log(`Selling token on: ${network}`);

  const [deployer] = await ethers.getSigners();

  const systemContract = await SystemContract__factory.connect(SYSTEM_CONTRACT, deployer);
  const uniswapRouter = await UniswapV2Router02__factory.connect(uniswapRouterAddress, deployer);

  const tokenAddress = await systemContract.gasCoinZRC20ByChainId(getChainId(network));
  const tokenContract = ERC20__factory.connect(tokenAddress, deployer);

  await printReserves(tokenContract, WZETAAddress, uniswapFactoryAddress, deployer);
  // await swapZeta(tokenContract, WZETAAddress, tokenAmountToSell, uniswapRouter, deployer);
  await printReserves(tokenContract, WZETAAddress, uniswapFactoryAddress, deployer);
}
async function main() {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const WZETA_ADDRESS = getNonZetaAddress("weth9", networkName);

  const UNISWAP_FACTORY_ADDRESS = getNonZetaAddress("uniswapV2Factory", networkName);

  const UNISWAP_ROUTER_ADDRESS = getNonZetaAddress("uniswapV2Router02", networkName);

  if (!ETH_TO_SELL.isZero()) {
    await sellToken("goerli_testnet", ETH_TO_SELL, WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  }
  if (!MATIC_TO_SELL.isZero()) {
    await sellToken("mumbai_testnet", MATIC_TO_SELL, WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  }
  if (!BNB_TO_SELL.isZero()) {
    await sellToken("bsc_testnet", BNB_TO_SELL, WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  }
  if (!BTC_TO_SELL.isZero()) {
    await sellToken("btc_testnet", BTC_TO_SELL, WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
