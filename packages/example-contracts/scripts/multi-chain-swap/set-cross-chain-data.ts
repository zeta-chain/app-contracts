import { isNetworkName } from "@zetachain/addresses";
import { ethers, network } from "hardhat";

import { getMultiChainSwapBase } from "../../lib/multi-chain-swap/MultiChainSwap.helpers";
import { getAddress } from "../../lib/shared/address.helpers";
import { networkVariables } from "../../lib/shared/network.constants";

export async function setMultiChainSwapCrossChainData() {
  if (!isNetworkName(network.name)) throw new Error("Invalid network name");

  const _networkVariables = networkVariables[network.name];

  if (!_networkVariables.crossChainName) throw new Error("Invalid crossChainName");

  const crossChainMultiChainSwapAddress = getAddress("multiChainSwap");

  const crossChainMultiChainSwapContract = await getMultiChainSwapBase({
    existingContractAddress: crossChainMultiChainSwapAddress
  });

  const crossChainAddress = getAddress("multiChainSwap", {
    customNetworkName: _networkVariables.crossChainName
  });

  const encodedCrossChainAddress = ethers.utils.solidityPack(["address"], [crossChainAddress]);

  console.log(
    "Setting cross-chain address:",
    encodedCrossChainAddress,
    "cross-chain id:",
    _networkVariables.crossChainId
  );

  await (
    await crossChainMultiChainSwapContract.setInteractorByChainId(
      _networkVariables.crossChainId,
      encodedCrossChainAddress
    )
  ).wait();
}

if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  setMultiChainSwapCrossChainData().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
