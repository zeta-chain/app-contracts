import { getChainId } from "@zetachain/addresses";
import { ethers } from "hardhat";

import { SystemContract__factory } from "../../typechain-types";
import { SYSTEM_CONTRACT } from "../systemConstants";

async function main() {
  const [deployer] = await ethers.getSigners();

  const systemContract = await SystemContract__factory.connect(SYSTEM_CONTRACT, deployer);
  let tokenAddress;
  tokenAddress = await systemContract.wZetaContractAddress();
  console.log(`wzetaContractAddress:`, tokenAddress);

  tokenAddress = await systemContract.gasCoinZRC20ByChainId(getChainId("bitcoin-test"));
  console.log(`tBTC:`, tokenAddress);
  tokenAddress = await systemContract.gasCoinZRC20ByChainId(getChainId("goerli"));
  console.log(`gETH:`, tokenAddress);
  tokenAddress = await systemContract.gasCoinZRC20ByChainId(getChainId("klaytn-baobab"));
  console.log(`tKLAY:`, tokenAddress);
  tokenAddress = await systemContract.gasCoinZRC20ByChainId(getChainId("bsc-testnet"));
  console.log(`tBNB:`, tokenAddress);
  tokenAddress = await systemContract.gasCoinZRC20ByChainId(getChainId("polygon-mumbai"));
  console.log(`tMATIC:`, tokenAddress);

  tokenAddress = await systemContract.uniswapv2FactoryAddress();
  console.log(`uniswapv2FactoryAddress:`, tokenAddress);
  tokenAddress = await systemContract.uniswapv2Router02Address();
  console.log(`uniswapv2Router02Address:`, tokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
