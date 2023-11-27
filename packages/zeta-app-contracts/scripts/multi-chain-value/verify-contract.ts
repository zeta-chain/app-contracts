import { getAddress, isProtocolNetworkName } from "@zetachain/protocol-contracts";
import hardhat from "hardhat";
import { network } from "hardhat";

import { getAppAddress } from "../address.helpers";

const networkName = network.name;

async function main() {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  await hardhat.run("verify:verify", {
    address: getAppAddress("multiChainValue", networkName),
    constructorArguments: [getAddress("connector", networkName), getAddress("zetaToken", networkName)],
    contract: "contracts/multi-chain-value/MultiChainValue.sol:MultiChainValue"
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
