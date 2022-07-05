import { getAddress } from "@zetachain/addresses";
import hardhat from "hardhat";

async function main() {
  await hardhat.run("verify:verify", {
    address: getAddress("multiChainSwap"),
    constructorArguments: [getAddress("connector"), getAddress("zetaToken"), getAddress("uniswapV2Router02")],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
