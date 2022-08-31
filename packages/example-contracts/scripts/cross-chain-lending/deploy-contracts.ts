// eslint-disable-next-line no-unused-vars
import { getAddress, isNetworkName, NetworkName } from "@zetachain/addresses";
import { saveAddress } from "@zetachain/addresses-tools";
import { network } from "hardhat";

import { getContract, getContractForNetwork } from "../../lib/shared/deploy.helpers";
import {
  CrossChainLending,
  CrossChainLending__factory,
  OracleChainLink,
  OracleChainLink__factory
} from "../../typechain-types";

export const deployContracts = async (networkName: NetworkName) => {
  console.log(`CrossChainLending: Deploying contracts...`);
  if (!isNetworkName(network.name)) throw new Error("Invalid network name");

  const connector = getAddress("connector", { customNetworkName: networkName });
  const zetaToken = getAddress("zetaToken", { customNetworkName: networkName });

  const crossChainLending = await getContractForNetwork<CrossChainLending__factory, CrossChainLending>({
    contractName: "CrossChainLending",
    deployParams: [connector, zetaToken],
    networkName
  });

  saveAddress("crossChainLending", crossChainLending.address);
  console.log(`CrossChainLending deployed: ${crossChainLending.address} [${connector}, ${zetaToken}]`);

  // const oracleChainLink = await getContractForNetwork<OracleChainLink__factory, OracleChainLink>({
  //   contractName: "OracleChainLink",
  //   deployParams: [],
  //   networkName
  // });

  // saveAddress("crossChainLendingOracle", oracleChainLink.address);
  // console.log(`OracleChainLink deployed: ${oracleChainLink.address}`);
};
