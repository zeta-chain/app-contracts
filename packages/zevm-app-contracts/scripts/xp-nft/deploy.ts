import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network, run, upgrades } from "hardhat";

import { ZetaXP__factory } from "../../typechain-types";
import { saveAddress } from "../address.helpers";

const networkName = network.name;

const ZETA_BASE_URL = "https://api.zetachain.io/nft/";
const signer = "0x1d24d94520B94B26351f6573de5ef9731c48531A";
const owner = "0x1d24d94520B94B26351f6573de5ef9731c48531A";

const verifyContract = async (contractAddress: string, constructorArguments: any[]) => {
  // Verification process
  console.log(`Verifying contract ${contractAddress}...`);
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments,
    });
    console.log("Verification successful");
  } catch (error) {
    console.error("Verification failed:", error);
  }
};

const deployZetaXP = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const ZetaXPFactory = (await ethers.getContractFactory("ZetaXP")) as ZetaXP__factory;
  const zetaXP = await upgrades.deployProxy(ZetaXPFactory, ["ZETA NFT", "ZNFT", ZETA_BASE_URL, signer, owner]);

  await zetaXP.deployed();

  // Get the implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(zetaXP.address);

  console.log("ZetaXP deployed to:", zetaXP.address);
  console.log("ZetaXP implementation deployed to:", implementationAddress);

  saveAddress("ZetaXP", zetaXP.address, networkName);

  await verifyContract(zetaXP.address, ["ZETA NFT", "ZNFT", ZETA_BASE_URL, signer]);
  await verifyContract(implementationAddress, []);
};

const main = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  await deployZetaXP();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
