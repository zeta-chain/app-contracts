// eslint-disable-next-line no-unused-vars
import { getAddress, isNetworkName, NetworkName } from "@zetachain/addresses";
import { ethers } from "hardhat";

import { getContractForNetwork } from "../../lib/shared/deploy.helpers";
import { networkVariables } from "../../lib/shared/network.constants";
import { CrossChainLending, CrossChainLending__factory } from "../../typechain-types";

export const setCrossChainData = async (networkName: NetworkName) => {
  console.log(`CrossChainLending: Setting cross chain data...`);

  if (!isNetworkName(networkName)) throw new Error("Invalid network name");

  const crossChainLending = await getContractForNetwork<CrossChainLending__factory, CrossChainLending>({
    contractName: "CrossChainLending",
    networkName,
    zetaAddress: "crossChainLending"
  });

  const _networkVariables = networkVariables[networkName];

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

  await crossChainLending.setInteractorByChainId(_networkVariables.crossChainId, encodedCrossChainAddress);
};
