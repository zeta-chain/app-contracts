import { getAddress } from "@zetachain/addresses";
import hardhat from "hardhat";

import { getCrossChainWarriorsArgs } from "../../lib/cross-chain-warriors/CrossChainWarriors.helpers";

async function main() {
  await hardhat.run("verify:verify", {
    address: getAddress("crossChainNft"),
    constructorArguments: getCrossChainWarriorsArgs(),
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
