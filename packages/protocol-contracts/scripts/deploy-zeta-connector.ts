import { getAddress, isNetworkName } from "@zetachain/addresses";
import { saveAddress } from "@zetachain/addresses-tools";
import { Contract } from "ethers";
import { network } from "hardhat";

import { deployZetaConnectorEth, deployZetaConnectorNonEth, isEthNetworkName } from "../lib/contracts.helpers";

export async function deployZetaConnector() {
  if (!isNetworkName(network.name)) {
    throw new Error(`network.name: ${network.name} isn't supported.`);
  }

  let contract: Contract;
  console.log(`Deploying ZetaConnector to ${network.name}`);

  if (isEthNetworkName(network.name)) {
    contract = await deployZetaConnectorEth({
      args: [getAddress("zetaToken"), getAddress("tss"), getAddress("tssUpdater")],
    });
  } else {
    contract = await deployZetaConnectorNonEth({
      args: [getAddress("zetaToken"), getAddress("tss"), getAddress("tssUpdater")],
    });
  }

  saveAddress("connector", contract.address);
  console.log("Deployed ZetaConnector. Address:", contract.address);
}

if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  deployZetaConnector()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
