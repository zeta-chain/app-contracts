import { BigNumber } from "@ethersproject/bignumber";
import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { parseEther } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import { RewardDistributorFactory__factory, SystemContract__factory } from "../../typechain-types";
import { getSystemContractAddress, getZEVMAppAddress } from "../address.helpers";
import { addReward, deployRewardByToken } from "./helpers";

const REWARD_DURATION = BigNumber.from("604800").mul(8); // 1 week * 8
const REWARDS_AMOUNT = parseEther("500");
const TOKEN_ADDRESS = "0x0dee8b6e2d2035a798b67c68d47f941718a62263";

const main = async () => {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const systemContractAddress = getSystemContractAddress();
  const systemContract = await SystemContract__factory.connect(systemContractAddress, deployer);

  const factoryContractAddress = getZEVMAppAddress("rewardDistributorFactory");

  const rewardDistributorFactory = RewardDistributorFactory__factory.connect(factoryContractAddress, deployer);

  const rewardContractAddress = await deployRewardByToken(
    deployer,
    systemContract,
    TOKEN_ADDRESS,
    rewardDistributorFactory
  );
  await addReward(deployer, systemContract, rewardContractAddress, REWARD_DURATION, REWARDS_AMOUNT);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
