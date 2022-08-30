// eslint-disable-next-line no-unused-vars
import { getAddress, isNetworkName } from "@zetachain/addresses";
import { saveAddress } from "@zetachain/addresses-tools";
import { network } from "hardhat";

import { getContract } from "../../lib/shared/deploy.helpers";
import {
  CrossChainLending,
  CrossChainLending__factory,
  OracleChainLink,
  OracleChainLink__factory
} from "../../typechain-types";

export const deployContracts = async () => {
  console.log(`Deploying CrossChainLending...`);
  if (!isNetworkName(network.name)) throw new Error("Invalid network name");

  const connector = getAddress("connector");
  const zetaToken = getAddress("zetaToken");

  const crossChainLending = await getContract<CrossChainLending__factory, CrossChainLending>({
    contractName: "CrossChainLending",
    deployParams: [connector, zetaToken]
  });

  saveAddress("crossChainLending", crossChainLending.address);
  console.log(`CrossChainLending deployed: ${crossChainLending.address} [${connector}, ${zetaToken}]`);

  const oracleChainLink = await getContract<OracleChainLink__factory, OracleChainLink>({
    contractName: "OracleChainLink",
    deployParams: []
  });

  saveAddress("crossChainLendingOracle", oracleChainLink.address);
  console.log(`OracleChainLink deployed: ${oracleChainLink.address}`);
};
