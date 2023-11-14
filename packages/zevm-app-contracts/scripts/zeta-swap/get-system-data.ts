import { ZetaProtocolNetwork } from "@zetachain/protocol-contracts";
import { ethers } from "hardhat";

import { SystemContract, SystemContract__factory } from "../../typechain-types";
import { getChainId, getGasSymbolByNetwork, getSystemContractAddress } from "../address.helpers";

const getZRC20Address = async (systemContract: SystemContract, network: ZetaProtocolNetwork) => {
  const tokenAddress = await systemContract.gasCoinZRC20ByChainId(getChainId(network));
  console.log(`${getGasSymbolByNetwork(network)}`, tokenAddress);
  const tokenAddressLP = await systemContract.gasZetaPoolByChainId(getChainId(network));
  console.log(`${getGasSymbolByNetwork(network)} LP`, tokenAddressLP);
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const SYSTEM_CONTRACT = getSystemContractAddress();
  console.log(`SYSTEM CONTRACT:`, SYSTEM_CONTRACT);

  const systemContract = await SystemContract__factory.connect(SYSTEM_CONTRACT, deployer);
  const uniswapFactoryAddress = await systemContract.uniswapv2FactoryAddress();
  console.log(`uniswapv2Factory:`, uniswapFactoryAddress);
  const uniswapRouterAddress = await systemContract.uniswapv2Router02Address();
  console.log(`uniswapv2Router02:`, uniswapRouterAddress);

  const WZETAAddress = await systemContract.wZetaContractAddress();
  console.log(`WZETA:`, WZETAAddress);
  await getZRC20Address(systemContract, "btc_testnet");
  await getZRC20Address(systemContract, "goerli_testnet");
  // await getZRC20Address(systemContract, "klaytn-baobab");
  await getZRC20Address(systemContract, "bsc_testnet");
  await getZRC20Address(systemContract, "mumbai_testnet");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
