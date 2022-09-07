import hardhat from "hardhat";

import { getCrossChainWarriorsArgs } from "../../lib/cross-chain-warriors/CrossChainWarriors.helpers";
import { getAddress } from "../../lib/shared/address.helpers";

async function main() {
  await hardhat.run("verify:verify", {
    address: getAddress("crossChainNft"),
    constructorArguments: getCrossChainWarriorsArgs()
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
