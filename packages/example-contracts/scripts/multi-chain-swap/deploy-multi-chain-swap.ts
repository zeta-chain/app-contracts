import { isNetworkName } from "@zetachain/addresses";
import { saveAddress } from "@zetachain/addresses-tools";
import { network } from "hardhat";

import { getMultiChainSwapUniV2 } from "../../lib/multi-chain-swap/MultiChainSwap.helpers";

export async function deployMultiChainSwap() {
  if (!isNetworkName(network.name) || !network.name) throw new Error("Invalid network name");

  const multiChainSwapContract = await getMultiChainSwapUniV2({
    deployParams: [getAddress("connector"), getAddress("zetaToken"), getAddress("uniswapV2Router02")],
  });

  saveAddress("multiChainSwap", multiChainSwapContract.address);
}

if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  deployMultiChainSwap().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
