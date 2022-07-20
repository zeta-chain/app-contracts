import { isNetworkName, saveAddress } from "@zetachain/addresses";
import { network } from "hardhat";

import { deployImmutableCreate2Factory as deploy } from "../lib/contracts.helpers";

export async function deployImmutableCreate2Factory() {
  if (!isNetworkName(network.name)) {
    throw new Error(`network.name: ${network.name} isn't supported.`);
  }

  console.log(`Deploying ImmutableCreate2Factory to ${network.name}`);

  const contract = await deploy();

  saveAddress("immutableCreate2Factory", contract.address);
  console.log("Deployed ImmutableCreate2Factory. Address:", contract.address);
}

if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  deployImmutableCreate2Factory()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
