import { deployMultiChainSwap } from "./deploy-multi-chain-swap";
import { setMultiChainSwapCrossChainData } from "./set-cross-chain-data";

async function main() {
  // await deployMultiChainSwap();
  await setMultiChainSwapCrossChainData();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
