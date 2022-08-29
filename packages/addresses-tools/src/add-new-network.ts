import { isZetaNetworkName, ZetaNetworkName } from "@zetachain/addresses";

import { addNewNetwork } from "./addresses.helpers";

const name = process.argv[2];
const parsedAddTo = process.argv[3].split(",");

if (!name || !parsedAddTo.every(isZetaNetworkName)) {
  console.log("Usage: 'ts-node src/add-new-network <network-name> <comma-separated-zeta-networks>'.");
  console.log("Usage e.g.: 'ts-node src/add-new-network rinkeby athens'.");
  process.exit(1);
}

addNewNetwork(name, parsedAddTo);
