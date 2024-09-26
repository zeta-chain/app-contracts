import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network } from "hardhat";

import { ProofOfLiveness__factory } from "../../typechain-types";
import { saveAddress } from "../address.helpers";
import { verifyContract } from "../explorer.helpers";

const networkName = network.name;

const deployProofOfLiveness = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const ProofOfLivenessFactory = (await ethers.getContractFactory("ProofOfLiveness")) as ProofOfLiveness__factory;
  const ProofOfLiveness = await ProofOfLivenessFactory.deploy();

  await ProofOfLiveness.deployed();

  console.log("ProofOfLiveness deployed to:", ProofOfLiveness.address);

  saveAddress("ProofOfLiveness", ProofOfLiveness.address, networkName);

  await verifyContract(ProofOfLiveness.address, []);
};

const main = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  await deployProofOfLiveness();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
