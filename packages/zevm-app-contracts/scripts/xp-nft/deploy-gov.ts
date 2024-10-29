import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network } from "hardhat";

import { getZEVMAppAddress, saveAddress } from "../address.helpers";
import { verifyContract } from "../explorer.helpers";

const networkName = network.name;

const encodeTag = (tag: string) => ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["string"], [tag]));

const executeVerifyContract = async (name: string, address: string, args: any[]) => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  console.log(`${name} deployed to:`, address);
  saveAddress(`${name}`, address, networkName);
  await verifyContract(address, args);
};

const deployXPGov = async () => {
  const [signer] = await ethers.getSigners();

  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  const zetaXPAddress = getZEVMAppAddress("ZetaXP", networkName);
  console.log("ZetaXP address:", zetaXPAddress);

  // Deploy the TimelockController contract
  const timelockFactory = await ethers.getContractFactory("TimelockController");
  const timelock = await timelockFactory.deploy(3600, [signer.address], [signer.address], signer.address);
  await timelock.deployed();

  const timelockAddress = timelock.address;
  executeVerifyContract("TimelockController", timelockAddress, [
    3600,
    [signer.address],
    [signer.address],
    signer.address,
  ]);

  const tag = encodeTag("XP_NFT");

  // Deploy the ZetaXPGov contract
  const ZetaXPGovFactory = await ethers.getContractFactory("ZetaXPGov");
  const zetaGov = await ZetaXPGovFactory.deploy(zetaXPAddress, timelockAddress, 4, tag);
  await zetaGov.deployed();

  const zetaGovAddress = zetaGov.address;

  executeVerifyContract("ZetaXPGov", zetaGovAddress, [zetaXPAddress, timelockAddress, 4, tag]);

  // Assign proposer and executor roles to the signer
  const proposerRole = await timelock.PROPOSER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();
  await timelock.grantRole(proposerRole, zetaGovAddress);
  await timelock.grantRole(executorRole, zetaGovAddress);
};

const main = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  await deployXPGov();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
