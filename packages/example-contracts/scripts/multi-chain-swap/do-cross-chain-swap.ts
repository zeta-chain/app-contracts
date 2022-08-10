import { getAddress, isNetworkName } from "@zetachain/addresses";
import { parseUnits } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import { getMultiChainSwapUniV2 } from "../../lib/multi-chain-swap/MultiChainSwap.helpers";
import { networkVariables } from "../../lib/shared/network.constants";

export async function doCrossChainSwap() {
  if (!isNetworkName(network.name)) throw new Error("Invalid network name");

  const _networkVariables = networkVariables[network.name];

  if (!_networkVariables.crossChainName) throw new Error("Invalid crossChainName");

  const multiChainSwapContract = await getMultiChainSwapUniV2({
    existingContractAddress: getAddress("multiChainSwap")
  });

  const [account1] = await ethers.getSigners();

  await (
    await multiChainSwapContract.swapETHForTokensCrossChain(
      ethers.utils.solidityPack(["address"], [account1.address]),
      getAddress("zetaToken", { customNetworkName: _networkVariables.crossChainName }),
      false,
      0,
      _networkVariables.crossChainId,
      1_000_000,
      {
        value: parseUnits("1")
      }
    )
  ).wait();
}

if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  doCrossChainSwap().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
