import { getAddress, isNetworkName, saveAddress } from "@zetachain/addresses";
import { Contract } from "ethers";
import { network } from "hardhat";

import { ZETA_INITIAL_SUPPLY } from "../lib/contracts.constants";
import { deployZetaEth, deployZetaNonEth, isEthNetworkName } from "../lib/contracts.helpers";

export async function deployZetaToken() {
  if (!isNetworkName(network.name)) {
    throw new Error(`network.name: ${network.name} isn't supported.`);
  }

  let contract: Contract;

  if (isEthNetworkName(network.name)) {
    contract = await deployZetaEth({
      args: [ZETA_INITIAL_SUPPLY],
    });
  } else {
    contract = await deployZetaNonEth({
      args: [0, getAddress("tss"), getAddress("tssUpdater")],
    });
  }

  saveAddress("zetaToken", contract.address);
  console.log("Deployed Zeta to:", contract.address);
}

if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  deployZetaToken()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
