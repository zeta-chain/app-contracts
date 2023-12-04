import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network } from "hardhat";

import { Disperse__factory } from "../../typechain-types";
import { saveAddress } from "../address.helpers";

const networkName = network.name;

async function main() {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const DisperseFactory = (await ethers.getContractFactory("Disperse")) as Disperse__factory;

  const disperseFactory = await DisperseFactory.deploy();
  await disperseFactory.deployed();
  console.log("Disperse deployed to:", disperseFactory.address);
  saveAddress("disperse", disperseFactory.address);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
