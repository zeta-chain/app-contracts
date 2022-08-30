// eslint-disable-next-line no-unused-vars
import { deployContracts } from "./deploy-contracts";
import { setCrossChainData } from "./set-cross-chain-data";
import { setInitialData } from "./set-initial-data";

async function main() {
  await deployContracts();
  await setInitialData();
  // await setCrossChainData();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
