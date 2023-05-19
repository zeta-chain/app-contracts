import { isNetworkName } from "@zetachain/addresses";
import { ethers, network } from "hardhat";

import { RewardDistributor__factory, RewardDistributorFactory__factory } from "../typechain-types";

const networkName = network.name;

//@todo: this is here because need to import address pkg but this pkg will be move to new repo,
// so will refactor when it will be done

export const FACTORY_CONTRACT = "0xf05Bc79b88026fbC32221926308405C2Bf919f2E";

const readRewardData = async (rewardContractAddress: string) => {
  const [deployer] = await ethers.getSigners();
  const rewardDistributorContract = await RewardDistributor__factory.connect(rewardContractAddress, deployer);

  const stakingTokenA = await rewardDistributorContract.stakingTokenA();
  const stakingTokenB = await rewardDistributorContract.stakingTokenB();

  const rewardsToken = await rewardDistributorContract.rewardsToken();
  const stakingToken = await rewardDistributorContract.stakingToken();
  const periodFinish = await rewardDistributorContract.periodFinish();
  const rewardRate = await rewardDistributorContract.rewardRate();
  const rewardsDuration = await rewardDistributorContract.rewardsDuration();
  const lastUpdateTime = await rewardDistributorContract.lastUpdateTime();
  const rewardPerTokenStored = await rewardDistributorContract.rewardPerTokenStored();

  console.table({
    contract: rewardContractAddress,
    lastUpdateTime: `${lastUpdateTime.toString()}-${new Date(lastUpdateTime.toNumber() * 1000).toISOString()}`,
    periodFinish: `${periodFinish.toString()}-${new Date(periodFinish.toNumber() * 1000).toISOString()}`,
    rewardPerTokenStored: rewardPerTokenStored.toString(),
    rewardRate: rewardRate.toString(),
    rewardsDuration: rewardsDuration.toString(),
    rewardsToken: rewardsToken,
    stakingToken: stakingToken,
    stakingTokenA,
    stakingTokenB
  });
};

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!isNetworkName(networkName)) throw new Error("Invalid network name");

  const rewardDistributorFactory = RewardDistributorFactory__factory.connect(FACTORY_CONTRACT, deployer);
  const incentivesContractsLen = await rewardDistributorFactory.incentivesContractsLen();

  const incentiveContracts: string[] = [];
  for (let i = 0; i < incentivesContractsLen.toNumber(); i++) {
    const incentiveContract = await rewardDistributorFactory.incentivesContracts(i);
    incentiveContracts.push(incentiveContract);
  }

  console.log("incentiveContracts", incentiveContracts);
  incentiveContracts.forEach(async incentiveContract => {
    await readRewardData(incentiveContract);
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
