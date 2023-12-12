import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network } from "hardhat";

import { InvitationManager__factory } from "../../typechain-types";
import { saveAddress } from "../address.helpers";

const networkName = network.name;

const invitationManager = async () => {
  const InvitationManagerFactory = (await ethers.getContractFactory("InvitationManager")) as InvitationManager__factory;
  const invitationManager = await InvitationManagerFactory.deploy();
  await invitationManager.deployed();
  console.log("InvitationManager deployed to:", invitationManager.address);
  saveAddress("invitationManager", invitationManager.address);
};

const main = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  await invitationManager();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
