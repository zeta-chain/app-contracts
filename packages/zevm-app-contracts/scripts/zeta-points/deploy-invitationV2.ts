import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network } from "hardhat";

import { InvitationManagerV2__factory } from "../../typechain-types";
import { getZEVMAppAddress, saveAddress } from "../address.helpers";
import { verifyContract } from "../explorer.helpers";

const networkName = network.name;

const invitationManager = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const invitationManagerV1 = getZEVMAppAddress("invitationManager", networkName);

  const InvitationManagerFactory = (await ethers.getContractFactory(
    "InvitationManagerV2"
  )) as InvitationManagerV2__factory;
  const invitationManager = await InvitationManagerFactory.deploy(invitationManagerV1);
  await invitationManager.deployed();
  console.log("InvitationManagerV2 deployed to:", invitationManager.address);
  saveAddress("invitationManagerV2", invitationManager.address, networkName);
  await verifyContract(invitationManager.address, [invitationManagerV1]);
};

const main = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  await invitationManager();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
