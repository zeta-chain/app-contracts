import assert from "assert";
import { ContractFactory, ContractReceipt } from "ethers";
import { ethers, network } from "hardhat";

import {
  CrossChainMessage,
  CrossChainMessage__factory,
  CrossChainMessageConnector,
  CrossChainMessageConnector__factory,
} from "../../typechain-types";

export type GetContractParams<Factory extends ContractFactory> =
  | {
      deployParams: Parameters<Factory["deploy"]>;
      existingContractAddress?: null;
    }
  | {
      deployParams?: null;
      existingContractAddress: string;
    };

/**
 * @description only for testing or local environment
 */
export const deployCrossChainMessageMock = async ({
  zetaConnectorMockAddress,
  zetaTokenConsumerAddress,
  zetaTokenMockAddress,
}: {
  zetaConnectorMockAddress: string;
  zetaTokenConsumerAddress: string;
  zetaTokenMockAddress: string;
}) => {
  const isLocalEnvironment = network.name === "hardhat";

  assert(isLocalEnvironment, "deployCrossChainMessageMock is only intended to be used in the local environment");

  const Factory = (await ethers.getContractFactory("CrossChainMessage")) as CrossChainMessage__factory;

  const crossChainMessageContract = (await Factory.deploy(
    zetaConnectorMockAddress,
    zetaTokenMockAddress,
    zetaTokenConsumerAddress
  )) as CrossChainMessage;

  await crossChainMessageContract.deployed();

  return crossChainMessageContract;
};

export const deployZetaConnectorMock = async () => {
  const Factory = (await ethers.getContractFactory(
    "CrossChainMessageConnector"
  )) as CrossChainMessageConnector__factory;

  const zetaConnectorMockContract = (await Factory.deploy()) as CrossChainMessageConnector;

  await zetaConnectorMockContract.deployed();

  return zetaConnectorMockContract;
};

export const parseCrossChainMessageLog = (logs: ContractReceipt["logs"]) => {
  const iface = CrossChainMessage__factory.createInterface();

  const eventNames = logs.map((log) => {
    try {
      const parsedLog = iface.parseLog(log);

      return parsedLog.name;
    } catch (e: any) {
      return "NO_ZETA_LOG";
    }
  });

  return eventNames;
};
