import { isNetworkName } from "@zetachain/addresses";
import { getSystemContractAddress } from "@zetachain/addresses-tools";
import { ethers, network } from "hardhat";

import { RewardDistributorFactory__factory, SystemContract__factory } from "../typechain-types";

const networkName = network.name;

const SYSTEM_CONTRACT = getSystemContractAddress();

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!isNetworkName(networkName)) throw new Error("Invalid network name");
  const systemContract = await SystemContract__factory.connect(SYSTEM_CONTRACT, deployer);
  const zetaTokenAddress = await systemContract.wZetaContractAddress();

  const RewardDistributorFactoryFactory = (await ethers.getContractFactory(
    "RewardDistributorFactory"
  )) as RewardDistributorFactory__factory;

  const rewardDistributorFactory = await RewardDistributorFactoryFactory.deploy(zetaTokenAddress, SYSTEM_CONTRACT);
  await rewardDistributorFactory.deployed();
  console.log("RewardDistributorFactory deployed to:", rewardDistributorFactory.address);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
