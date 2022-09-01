// eslint-disable-next-line no-unused-vars
import { deployContracts } from "./deploy-contracts";
import { setCrossChainData } from "./set-cross-chain-data";
import { setInitialData } from "./set-initial-data";

async function main() {
  await deployContracts("goerli");
  await deployContracts("bsc-testnet");
  await setCrossChainData("goerli");
  await setInitialData("goerli");
  await setCrossChainData("bsc-testnet");
  await setInitialData("bsc-testnet");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
