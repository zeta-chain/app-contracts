import { isNetworkName } from "@zetachain/addresses";
import { saveAddress } from "@zetachain/addresses-tools";
import { ethers, network } from "hardhat";

import { getAddress } from "../lib/address.helpers";
import { getZetaConnectorEth, getZetaConnectorNonEth, isEthNetworkName } from "../lib/contracts.helpers";

async function sendGas() {
  if (!isNetworkName(network.name)) {
    throw new Error(`network.name: ${network.name} isn't supported.`);
  }

  const [, tssUpdaterSigner] = await ethers.getSigners();

  const newTssAddress = "0x7c125C1d515b8945841b3d5144a060115C58725F";

  if (isEthNetworkName(network.name)) {
    const contract = (
      await getZetaConnectorEth({ deployParams: null, existingContractAddress: getAddress("connector") })
    ).connect(tssUpdaterSigner);

    await (await contract.updateTssAddress(newTssAddress)).wait();
  } else {
    const contract = (
      await getZetaConnectorNonEth({ deployParams: null, existingContractAddress: getAddress("connector") })
    ).connect(tssUpdaterSigner);

    await (await contract.updateTssAddress(newTssAddress)).wait();
  }

  console.log(`Updated TSS address from ${getAddress("tss")} to ${newTssAddress}.`);

  saveAddress("tss", newTssAddress);
}

sendGas()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
