import { BigNumber } from "@ethersproject/bignumber";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getChainId, isNetworkName, NetworkName } from "@zetachain/addresses";
import { parseEther } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import {
  ERC20__factory,
  RewardDistributor__factory,
  RewardDistributorFactory,
  RewardDistributorFactory__factory,
  SystemContract,
  SystemContract__factory
} from "../typechain-types";

const networkName = network.name;
const REWARD_DURATION = BigNumber.from("604800"); // 1 week
const REWARDS_AMOUNT = parseEther("10");

//@todo: this is here because need to import address pkg but this pkg will be move to new repo,
// so will refactor when it will be done

export const SYSTEM_CONTRACT = "0x239e96c8f17C85c30100AC26F635Ea15f23E9c67";

interface Pair {
  TokenA: string;
  TokenB: string;
}

export const sortPair = (token1: string, token2: string): Pair => {
  if (token1 < token2) {
    return { TokenA: token1, TokenB: token2 };
  }
  return { TokenA: token2, TokenB: token1 };
};

const getZRC20Address = async (systemContract: SystemContract, network: NetworkName) => {
  const tokenAddress = await systemContract.gasCoinZRC20ByChainId(getChainId(network));
  return tokenAddress;
};

const deployRewardByNetwork = async (
  deployer: SignerWithAddress,
  systemContract: SystemContract,
  networkName: NetworkName,
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

  const event = receipt.events?.find(e => e.event === "RewardDistributorCreated");

  const { rewardDistributorContract: rewardDistributorContractAddress } = event?.args as any;

  const rewardDistributorContract = await RewardDistributor__factory.connect(
    rewardDistributorContractAddress,
    deployer
  );

  const ZETA = ERC20__factory.connect(zetaTokenAddress, deployer);
  await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
  await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
  await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

  console.log("RewardDistributor deployed to:", rewardDistributorContract.address);
};

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

  await deployRewardByNetwork(deployer, systemContract, "goerli", rewardDistributorFactory);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
