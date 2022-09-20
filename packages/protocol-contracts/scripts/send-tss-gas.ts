import { isNetworkName } from "@zetachain/addresses";
import { ethers, network } from "hardhat";

import { getAddress } from "../lib/address.helpers";

async function sendGas() {
  if (!isNetworkName(network.name)) {
    throw new Error(`network.name: ${network.name} isn't supported.`);
  }

  const [signer] = await ethers.getSigners();
  const sendGasTx = {
    from: signer.address,
    to: getAddress("tss"),
    value: ethers.utils.parseEther("1.0")
  };
  await signer.sendTransaction(sendGasTx);
  console.log(`Sent 1.0 Ether from ${signer.address} to TSS address (${getAddress("tss")}).`);
}

sendGas()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
