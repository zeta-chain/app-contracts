import { isNetworkName } from "@zetachain/addresses";
import { ethers, network } from "hardhat";

import { getAddress } from "../lib/address.helpers";
import { getZetaFactoryNonEth, isEthNetworkName } from "../lib/contracts.helpers";

async function updateZetaConnector() {
  if (!isNetworkName(network.name)) {
    throw new Error(`network.name: ${network.name} isn't supported.`);
  }

  const [, tssUpdaterSigner] = await ethers.getSigners();

  if (isEthNetworkName(network.name)) {
    throw new Error(`network.name: ${network.name} isn't supported.`);
  }

  const contract = (
    await getZetaFactoryNonEth({ deployParams: null, existingContractAddress: getAddress("zetaToken") })
  ).connect(tssUpdaterSigner);

  await (await contract.updateTssAndConnectorAddresses(getAddress("tss"), getAddress("connector"))).wait();

  console.log(`Updated TSS address to ${getAddress("tss")}.`);
  console.log(`Updated Connector address to ${getAddress("connector")}.`);
}

updateZetaConnector()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
