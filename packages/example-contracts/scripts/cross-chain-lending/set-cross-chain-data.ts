// eslint-disable-next-line no-unused-vars
import { getAddress, isNetworkName } from "@zetachain/addresses";
import { ethers, network } from "hardhat";

import { getContract } from "../../lib/shared/deploy.helpers";
import { networkVariables } from "../../lib/shared/network.constants";
import { CrossChainLending, CrossChainLending__factory } from "../../typechain-types";

export const setCrossChainData = async () => {
  console.log(`Deploying CrossChainLending...`);

  if (!isNetworkName(network.name)) throw new Error("Invalid network name");

  const crossChainLending = await getContract<CrossChainLending__factory, CrossChainLending>({
    contractName: "CrossChainLending",
    deployParams: undefined,
    existingContractAddress: getAddress("crossChainLending")
  });

  const _networkVariables = networkVariables[network.name];

  if (!_networkVariables.crossChainName) throw new Error("Invalid crossChainName");

  const crossChainAddress = getAddress("crossChainLending", {
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
    await crossChainLending.setInteractorByChainId(_networkVariables.crossChainId, encodedCrossChainAddress)
  ).wait();
};
