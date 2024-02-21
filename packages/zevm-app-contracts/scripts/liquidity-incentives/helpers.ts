import { BigNumber } from "@ethersproject/bignumber";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ZetaProtocolNetwork } from "@zetachain/protocol-contracts";
import { parseEther } from "ethers/lib/utils";

import {
  ERC20__factory,
  RewardDistributor__factory,
  RewardDistributorFactory,
  SystemContract,
} from "../../typechain-types";
import { getChainId } from "../address.helpers";

export const deployRewardByToken = async (
  deployer: SignerWithAddress,
  systemContract: SystemContract,
  tokenAddress: string,
  rewardDistributorFactory: RewardDistributorFactory
) => {
  const zetaTokenAddress = await systemContract.wZetaContractAddress();

  const tx = await rewardDistributorFactory.createTokenIncentive(
    deployer.address,
    deployer.address,
    zetaTokenAddress,
    // @dev: now we send both tokens so contract calculate internally LP address
    zetaTokenAddress,
    tokenAddress
  );

  const receipt = await tx.wait();

  const event = receipt.events?.find((e) => e.event === "RewardDistributorCreated");

  const { rewardDistributorContract: rewardDistributorContractAddress } = event?.args as any;

  console.log("RewardDistributor deployed to:", rewardDistributorContractAddress);

  return rewardDistributorContractAddress;
};

const getZRC20Address = async (systemContract: SystemContract, network: ZetaProtocolNetwork) => {
  const tokenAddress = await systemContract.gasCoinZRC20ByChainId(getChainId(network));
  return tokenAddress;
};

export const deployRewardByNetwork = async (
  deployer: SignerWithAddress,
  systemContract: SystemContract,
  networkName: ZetaProtocolNetwork,
  rewardDistributorFactory: RewardDistributorFactory
) => {
  const tokenAddress = await getZRC20Address(systemContract, networkName);
  const rewardContractAddress = await deployRewardByToken(
    deployer,
    systemContract,
    tokenAddress,
    rewardDistributorFactory
  );
  return rewardContractAddress;
};

export const addReward = async (
  deployer: SignerWithAddress,
  systemContract: SystemContract,
  rewardDistributorContractAddress: string,
  rewardAmount: BigNumber = parseEther("500"),
  rewardDuration: BigNumber = BigNumber.from("604800").mul(8) // 1 week * 8
) => {
  const zetaTokenAddress = await systemContract.wZetaContractAddress();

  const rewardDistributorContract = await RewardDistributor__factory.connect(
    rewardDistributorContractAddress,
    deployer
  );

  const ZETA = ERC20__factory.connect(zetaTokenAddress, deployer);
  const tx = await ZETA.transfer(rewardDistributorContract.address, rewardAmount.mul(1));
  await tx.wait();
  await rewardDistributorContract.setRewardsDuration(rewardDuration);
  await rewardDistributorContract.notifyRewardAmount(rewardAmount);

  console.log("Reward added to:", rewardDistributorContract.address);
};
