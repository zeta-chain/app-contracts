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

const ZETA_TO_SELL = parseUnits("0.001");

const swapZeta = async (
  tokenContract: ERC20,
  WZETAAddress: string,
  ZETAAmountToSell: BigNumber,
  uniswapRouter: IUniswapV2Router02,
  deployer: SignerWithAddress
) => {
  const tx = await uniswapRouter.swapExactETHForTokens(
    0,
    [WZETAAddress, tokenContract.address],
    deployer.address,
    (await getNow()) + 360,
    { gasLimit: 10_000_000, value: ZETAAmountToSell }
  );
  await tx.wait();

  console.log(`Sell tx hash: ${tx.hash}`);
};

async function sellZeta(
  network: ZetaProtocolNetwork,
  WZETAAddress: string,
  uniswapFactoryAddress: string,
  uniswapRouterAddress: string
) {
  console.log(`Sell ZETA on: ${network}`);

  const [deployer] = await ethers.getSigners();

  const systemContract = await SystemContract__factory.connect(SYSTEM_CONTRACT, deployer);
  const uniswapRouter = await UniswapV2Router02__factory.connect(uniswapRouterAddress, deployer);

  const tokenAddress = await systemContract.gasCoinZRC20ByChainId(getChainId(network));
  const tokenContract = ERC20__factory.connect(tokenAddress, deployer);

  await printReserves(tokenContract, WZETAAddress, uniswapFactoryAddress, deployer);
  // await swapZeta(tokenContract, WZETAAddress, ZETA_TO_SELL, uniswapRouter, deployer);
  await printReserves(tokenContract, WZETAAddress, uniswapFactoryAddress, deployer);
}
async function main() {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const WZETA_ADDRESS = getNonZetaAddress("weth9", networkName);

  const UNISWAP_FACTORY_ADDRESS = getNonZetaAddress("uniswapV2Factory", networkName);

  const UNISWAP_ROUTER_ADDRESS = getNonZetaAddress("uniswapV2Router02", networkName);

  await sellZeta("goerli_testnet", WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  await sellZeta("mumbai_testnet", WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  await sellZeta("bsc_testnet", WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  await sellZeta("btc_testnet", WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
