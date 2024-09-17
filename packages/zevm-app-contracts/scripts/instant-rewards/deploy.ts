import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network } from "hardhat";

import { InstantRewards__factory } from "../../typechain-types";
import { saveAddress } from "../address.helpers";
import { verifyContract } from "../explorer.helpers";

const networkName = network.name;

const signer = "0x1d24d94520B94B26351f6573de5ef9731c48531A";
const owner = "0x1d24d94520B94B26351f6573de5ef9731c48531A";

const deployInstantRewards = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const InstantRewardsFactory = (await ethers.getContractFactory("InstantRewards")) as InstantRewards__factory;
  const InstantRewards = await InstantRewardsFactory.deploy(signer, owner);

  await InstantRewards.deployed();

  console.log("InstantRewards deployed to:", InstantRewards.address);

  saveAddress("InstantRewards", InstantRewards.address, networkName);

  await verifyContract(InstantRewards.address, [signer, owner]);
};

const main = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  await deployInstantRewards();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
