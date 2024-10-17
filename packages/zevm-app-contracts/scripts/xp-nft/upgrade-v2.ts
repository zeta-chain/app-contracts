import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network, upgrades } from "hardhat";

import addresses from "../../data/addresses.json";
import { saveAddress } from "../address.helpers";
import { verifyContract } from "../explorer.helpers";

const networkName = network.name;

const upgradeZetaXP = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  //@ts-ignore
  const nftAddress = addresses["zevm"][networkName].ZetaXP;

  const ZetaXPFactory = await ethers.getContractFactory("ZetaXP_V2");
  const zetaXP = await upgrades.upgradeProxy(nftAddress, ZetaXPFactory);
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(zetaXP.address);

  console.log("ZetaXP upgraded in:", zetaXP.address);
  console.log("ZetaXP implementation deployed to:", implementationAddress);

  saveAddress("ZetaXP", zetaXP.address, networkName);

  await verifyContract(implementationAddress, []);
};

const main = async () => {
  await upgradeZetaXP();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
