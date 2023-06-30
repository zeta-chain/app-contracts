import { isNetworkName } from "@zetachain/addresses";
import { ethers, network } from "hardhat";

import { SYSTEM_CONTRACT } from "../../zevm-example-contracts/scripts/systemConstants";
import { RewardDistributorFactory__factory, SystemContract__factory } from "../typechain-types";

const networkName = network.name;

//@todo: this is here because need to import address pkg but this pkg will be move to new repo,
// so will refactor when it will be done
export const FACTORY_CONTRACT = "0xf05Bc79b88026fbC32221926308405C2Bf919f2E";

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
