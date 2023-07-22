import { isNetworkName } from "@zetachain/addresses";
import { saveAddress } from "@zetachain/addresses-tools";
import { network } from "hardhat";

import { getMultiChainSwapUniV3 } from "../../lib/multi-chain-swap/MultiChainSwap.helpers";
import { getAddress } from "../../lib/shared/address.helpers";

export async function deployMultiChainSwap() {
  if (!isNetworkName(network.name) || !network.name) throw new Error("Invalid network name");

  const CONNECTOR = getAddress("connector");

  const ZETA_TOKEN = getAddress("zetaToken");

  const UNI_QUOTER_V3 = getAddress("uniswapV3Quoter");

  const UNI_ROUTER_V3 = getAddress("uniswapV3Router");

  const WETH = getAddress("weth9");

  console.log([CONNECTOR, ZETA_TOKEN, UNI_ROUTER_V3, UNI_QUOTER_V3, WETH, 500, 3000]);

  return;
  const multiChainSwapContract = await getMultiChainSwapUniV3({
    deployParams: [CONNECTOR, ZETA_TOKEN, UNI_ROUTER_V3, UNI_QUOTER_V3, WETH, 500, 3000]
  });

  saveAddress("multiChainSwap", multiChainSwapContract.address);
}

if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  deployMultiChainSwap().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
