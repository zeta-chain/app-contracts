import { getAddress, isNetworkName } from "@zetachain/addresses";
import { ZetaNonEth__factory as ZetaNonEthFactory } from "@zetachain/interfaces/typechain-types";
import { ethers, network } from "hardhat";

export async function setZetaAddresses() {
  if (!isNetworkName(network.name)) {
    throw new Error(`network.name: ${network.name} isn't supported.`);
  }

  const factory = (await ethers.getContractFactory("ZetaNonEth")) as ZetaNonEthFactory;

  const [, tssSigner] = await ethers.getSigners();

  const contract = factory.attach(getAddress("zetaToken")).connect(tssSigner);

  console.log("Updating");
  await (await contract.updateTssAndConnectorAddresses(getAddress("tss"), getAddress("connector"))).wait();
  console.log("Updated");
}

if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  setZetaAddresses()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
