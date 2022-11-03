import hardhat from "hardhat";

import { getAddress } from "../../lib/shared/address.helpers";

async function main() {
  await hardhat.run("verify:verify", {
    address: getAddress("multiChainValue"),
    constructorArguments: [getAddress("connector"), getAddress("zetaToken")],
    contract: "contracts/multi-chain-value/MultiChainValue.sol:MultiChainValue"
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
