import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network } from "hardhat";

import { InstantRewardsFactory__factory } from "../../typechain-types";
import { saveAddress } from "../address.helpers";
import { verifyContract } from "../explorer.helpers";

const networkName = network.name;

const owner = "0xD7E8bD37db625a4856E056D2617C9d140dB99182";

const deployInstantRewards = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const InstantRewardsFactory = (await ethers.getContractFactory(
    "InstantRewardsFactory"
  )) as InstantRewardsFactory__factory;
  const InstantRewards = await InstantRewardsFactory.deploy(owner);

  await InstantRewards.deployed();

  console.log("InstantRewards deployed to:", InstantRewards.address);

  saveAddress("InstantRewardsFactory", InstantRewards.address, networkName);

  await verifyContract(InstantRewards.address, [owner]);
};

const main = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  await deployInstantRewards();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
