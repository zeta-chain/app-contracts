import { isNetworkName } from "@zetachain/addresses";
import { saveAddress } from "@zetachain/addresses-tools";
import { ethers, network } from "hardhat";

import { InvitationManager__factory, UserVerificationRegistry__factory } from "../../typechain-types";

const networkName = network.name;

const deployUserVerificationRegistry = async () => {
  const UserVerificationRegistryFactory = (await ethers.getContractFactory(
    "UserVerificationRegistry"
  )) as UserVerificationRegistry__factory;

  const userVerificationRegistry = await UserVerificationRegistryFactory.deploy();
  await userVerificationRegistry.deployed();
  console.log("UserVerificationRegistry deployed to:", userVerificationRegistry.address);
  // saveAddress("userVerificationRegistry", userVerificationRegistry.address);
};

const invitationManager = async () => {
  const InvitationManagerFactory = (await ethers.getContractFactory("InvitationManager")) as InvitationManager__factory;

  const invitationManager = await InvitationManagerFactory.deploy();
  await invitationManager.deployed();
  console.log("InvitationManager deployed to:", invitationManager.address);
  // saveAddress("invitationManager", invitationManager.address);
};

const main = async () => {
  if (!isNetworkName(networkName)) throw new Error("Invalid network name");

  await deployUserVerificationRegistry();
  await invitationManager();
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
