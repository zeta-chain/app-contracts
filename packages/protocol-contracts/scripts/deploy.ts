import { isLocalNetworkName, saveAddress } from "@zetachain/addresses";
import { ethers, network } from "hardhat";

import { isEthNetworkName } from "../lib/contracts.helpers";
import { deployZetaConnector } from "./deploy-zeta-connector";
import { deployZetaToken } from "./deploy-zeta-token";
import { setZetaAddresses } from "./set-zeta-token-addresses";

async function main() {
  if (isLocalNetworkName(network.name)) {
    const [owner] = await ethers.getSigners();
    saveAddress("tssUpdater", owner.address);
  }

  await deployZetaToken();
  await deployZetaConnector();

  /**
   * @description The Eth implementation of Zeta token doesn't need any address
   */
  if (isEthNetworkName(network.name)) return;

  /**
   * @description Avoid setting Zeta addresses for local network,
   * since it must be done after starting the local Zeta node
   */
  if (!isLocalNetworkName(network.name)) {
    await setZetaAddresses();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
