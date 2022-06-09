import { getAddress } from "@zetachain/addresses";
import hardhat from "hardhat";

async function main() {
  await hardhat.run("verify:verify", {
    address: getAddress("multiChainValue"),
    contract: "contracts/multi-chain-value/MultiChainValue.sol:MultiChainValue",
    constructorArguments: [getAddress("connector"), getAddress("zetaToken")],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
