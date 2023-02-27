import { getChainId } from "@zetachain/addresses";
import { NetworkName } from "@zetachain/addresses";
import { getGasSymbolByNetwork } from "@zetachain/addresses-tools";
import { ethers } from "hardhat";

import { SystemContract, SystemContract__factory } from "../../typechain-types";
import { SYSTEM_CONTRACT } from "../systemConstants";

const getZRC20Address = async (systemContract: SystemContract, network: NetworkName) => {
  const tokenAddress = await systemContract.gasCoinZRC20ByChainId(getChainId(network));
  console.log(`${getGasSymbolByNetwork(network)}`, tokenAddress);
};

async function main() {
  const [deployer] = await ethers.getSigners();

  const systemContract = await SystemContract__factory.connect(SYSTEM_CONTRACT, deployer);
  const uniswapFactoryAddress = await systemContract.uniswapv2FactoryAddress();
  console.log(`uniswapv2Factory:`, uniswapFactoryAddress);
  const uniswapRouterAddress = await systemContract.uniswapv2Router02Address();
  console.log(`uniswapv2Router02:`, uniswapRouterAddress);

  const WZETAAddress = await systemContract.wZetaContractAddress();
  console.log(`WZETA:`, WZETAAddress);
  await getZRC20Address(systemContract, "bitcoin-test");
  await getZRC20Address(systemContract, "goerli");
  await getZRC20Address(systemContract, "klaytn-baobab");
  await getZRC20Address(systemContract, "bsc-testnet");
  await getZRC20Address(systemContract, "polygon-mumbai");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
