import { isNetworkName } from "@zetachain/addresses";
import { saveAddress } from "@zetachain/addresses-tools";
import { network } from "hardhat";

import { getMultiChainSwapTrident } from "../../lib/multi-chain-swap/MultiChainSwap.helpers";
import { getAddress } from "../../lib/shared/address.helpers";

export async function deployMultiChainSwap() {
  if (!isNetworkName(network.name) || !network.name) throw new Error("Invalid network name");

  const CONNECTOR = getAddress("connector");

  const ZETA_TOKEN = getAddress("zetaToken");

  const UNI_ROUTER_V3 = getAddress("uniswapV3Router");

  const WETH = getAddress("weth9");

  const TRIDENT_POOL_FACTORY = getAddress("tridentPoolFactory");

  const multiChainSwapContract = await getMultiChainSwapTrident({
    deployParams: [CONNECTOR, ZETA_TOKEN, UNI_ROUTER_V3, WETH, TRIDENT_POOL_FACTORY]
  });

  saveAddress("multiChainSwap", multiChainSwapContract.address);
}

if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  deployMultiChainSwap().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
