import { MaxUint256 } from "@ethersproject/constants";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getChainId } from "@zetachain/addresses";
import { NetworkName } from "@zetachain/addresses";
import { getAddress } from "@zetachain/addresses";
import { getSystemContractAddress } from "@zetachain/addresses-tools";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import {
  ERC20,
  ERC20__factory,
  IUniswapV2Router02,
  SystemContract__factory,
  UniswapV2Router02__factory
} from "../../typechain-types";
import { getNow, printReserves } from "./uniswap.helpers";

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
  network: NetworkName,
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

  const UNISWAP_ROUTER_ADDRESS = getAddress({
    address: "uniswapV2Router02",
    networkName: "athens",
    zetaNetwork: "athens"
  });

  await sellZeta("goerli", WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  await sellZeta("polygon-mumbai", WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  await sellZeta("bsc-testnet", WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  await sellZeta("bitcoin-test", WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
