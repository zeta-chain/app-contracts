import { BigNumber } from "@ethersproject/bignumber";
import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { parseEther } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import { SystemContract__factory } from "../../typechain-types";
import { getSystemContractAddress } from "../address.helpers";
import { addReward } from "./helpers";

const REWARD_DURATION = BigNumber.from("604800").mul(8); // 1 week * 8
const REWARDS_AMOUNT = parseEther("500");
const REWARD_CONTRACT_ADDRESS = "0x0dee8b6e2d2035a798b67c68d47f941718a62263"; //@dev: change this to the address of the reward contract

const main = async () => {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const systemContractAddress = getSystemContractAddress();
  const systemContract = await SystemContract__factory.connect(systemContractAddress, deployer);

  await addReward(deployer, systemContract, REWARD_CONTRACT_ADDRESS, REWARD_DURATION, REWARDS_AMOUNT);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
