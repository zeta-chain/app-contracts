import { getAddress } from "@zetachain/addresses";
import { ethers, network } from "hardhat";

import { getCrossChainWarriors } from "../../lib/cross-chain-warriors/CrossChainWarriors.helpers";
import { isNetworkName, networkVariables } from "../../lib/shared/network.constants";

async function main() {
  if (!isNetworkName(network.name)) throw new Error("Invalid network name");

  const _networkVariables = networkVariables[network.name];

  const crossChainWarriorsAddress = getAddress("crossChainNft");

  const crossChainWarriorsContract = await getCrossChainWarriors(crossChainWarriorsAddress);

  if (_networkVariables.crossChainName === "") throw new Error("Invalid crossChainName");

  const crossChainAddress = getAddress("crossChainNft", {
    customNetworkName: _networkVariables.crossChainName,
  });

  const encodedCrossChainAddress = ethers.utils.solidityPack(["address"], [crossChainAddress]);

  console.log("Setting cross-chain address:", encodedCrossChainAddress);

  await (await crossChainWarriorsContract.setCrossChainAddress(encodedCrossChainAddress)).wait();

  console.log("Setting cross-chain id:", _networkVariables.crossChainId);

  await (await crossChainWarriorsContract.setCrossChainId(_networkVariables.crossChainId)).wait();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
