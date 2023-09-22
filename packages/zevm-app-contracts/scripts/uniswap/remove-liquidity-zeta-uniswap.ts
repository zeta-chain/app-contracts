import { MaxUint256 } from "@ethersproject/constants";
import { formatUnits } from "@ethersproject/units";
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
  IUniswapV2Factory__factory,
  IUniswapV2Pair,
  IUniswapV2Pair__factory,
  IUniswapV2Router02,
  SystemContract__factory,
  UniswapV2Router02__factory
} from "../../typechain-types";
import { getNow, printReserves, sortPair } from "./uniswap.helpers";

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
  network: NetworkName,
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

  await removeLiquidity("goerli", WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  await removeLiquidity("polygon-mumbai", WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  await removeLiquidity("bsc-testnet", WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
  await removeLiquidity("bitcoin-test", WZETA_ADDRESS, UNISWAP_FACTORY_ADDRESS, UNISWAP_ROUTER_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
