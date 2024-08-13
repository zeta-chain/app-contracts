import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network, upgrades } from "hardhat";

import { ZetaXP__factory } from "../../typechain-types";
import { saveAddress } from "../address.helpers";

const networkName = network.name;

const ZETA_BASE_URL = "https://api.zetachain.io/nft/";
const signer = "0x1d24d94520B94B26351f6573de5ef9731c48531A";

const deployZetaXP = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const ZetaXPFactory = (await ethers.getContractFactory("ZetaXP")) as ZetaXP__factory;
  const zetaXP = await upgrades.deployProxy(ZetaXPFactory, ["ZETA NFT", "ZNFT", ZETA_BASE_URL, signer]);

  await zetaXP.deployed();

  console.log("ZetaXP deployed to:", zetaXP.address);
  saveAddress("ZetaXP", zetaXP.address, networkName);
};

const main = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  await deployZetaXP();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
