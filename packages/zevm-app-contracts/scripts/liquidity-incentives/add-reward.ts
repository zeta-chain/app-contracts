import { BigNumber } from "@ethersproject/bignumber";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { isProtocolNetworkName, ZetaProtocolNetwork } from "@zetachain/protocol-contracts";
import { parseEther } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import {
  ERC20__factory,
  RewardDistributor__factory,
  RewardDistributorFactory,
  RewardDistributorFactory__factory,
  SystemContract,
  SystemContract__factory,
} from "../../typechain-types";
import { getChainId, getSystemContractAddress, getZEVMAppAddress } from "../address.helpers";

const SYSTEM_CONTRACT = getSystemContractAddress();

const networkName = network.name;
const REWARD_DURATION = BigNumber.from("604800").mul(8); // 1 week * 8
const REWARDS_AMOUNT = parseEther("500");

const getZRC20Address = async (systemContract: SystemContract, network: ZetaProtocolNetwork) => {
  const tokenAddress = await systemContract.gasCoinZRC20ByChainId(getChainId(network));
  return tokenAddress;
};

const deployRewardByNetwork = async (
  deployer: SignerWithAddress,
  systemContract: SystemContract,
  networkName: ZetaProtocolNetwork,
  rewardDistributorFactory: RewardDistributorFactory
) => {
  const tokenAddress = await getZRC20Address(systemContract, networkName);
  const zetaTokenAddress = await systemContract.wZetaContractAddress();

  const tx = await rewardDistributorFactory.createTokenIncentive(
    deployer.address,
    deployer.address,
    zetaTokenAddress,
    // @dev: now we send both tokens so contract calculate internaly LP address
    zetaTokenAddress,
    tokenAddress
  );

  const receipt = await tx.wait();

  const event = receipt.events?.find((e) => e.event === "RewardDistributorCreated");

  const { rewardDistributorContract: rewardDistributorContractAddress } = event?.args as any;

  console.log("RewardDistributor deployed to:", rewardDistributorContractAddress);

  return rewardDistributorContractAddress;
};

const addReward = async (
  deployer: SignerWithAddress,
  systemContract: SystemContract,
  rewardDistributorContractAddress: string
) => {
  const zetaTokenAddress = await systemContract.wZetaContractAddress();

  const rewardDistributorContract = await RewardDistributor__factory.connect(
    rewardDistributorContractAddress,
    deployer
  );

  const ZETA = ERC20__factory.connect(zetaTokenAddress, deployer);
  const tx = await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT.mul(1));
  await tx.wait();
  await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
  await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

  console.log("Reward added to:", rewardDistributorContract.address);
};

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  const systemContract = await SystemContract__factory.connect(SYSTEM_CONTRACT, deployer);

  const factoryContractAddress = getZEVMAppAddress("rewardDistributorFactory");

  const rewardDistributorFactory = RewardDistributorFactory__factory.connect(factoryContractAddress, deployer);
  let rewardContractAddress = "";
  // @dev: you can write your own address here to add reward to an existing contract
  // rewardContractAddress = "0x0dee8b6e2d2035a798b67c68d47f941718a62263";
  rewardContractAddress = await deployRewardByNetwork(
    deployer,
    systemContract,
    "goerli_testnet",
    rewardDistributorFactory
  );
  await addReward(deployer, systemContract, rewardContractAddress);

  rewardContractAddress = await deployRewardByNetwork(
    deployer,
    systemContract,
    "bsc_testnet",
    rewardDistributorFactory
  );
  await addReward(deployer, systemContract, rewardContractAddress);
  rewardContractAddress = await deployRewardByNetwork(
    deployer,
    systemContract,
    "btc_testnet",
    rewardDistributorFactory
  );
  await addReward(deployer, systemContract, rewardContractAddress);
  rewardContractAddress = await deployRewardByNetwork(
    deployer,
    systemContract,
    "mumbai_testnet",
    rewardDistributorFactory
  );
  await addReward(deployer, systemContract, rewardContractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
