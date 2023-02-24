import assert from "assert";
import { ethers, network } from "hardhat";

import {
  CounterZetaConnectorMock,
  CounterZetaConnectorMock__factory as CounterZetaConnectorMockFactory,
  CrossChainCounter,
  CrossChainCounter__factory as CrossChainCounterFactory,
} from "../../typechain-types";
import { isNetworkName, networkVariables } from "../shared/network.constants";

/**
 * @description only for testing or local environment
 */
export const deployTestCrossChainCounter = async ({
  zetaConnectorMockAddress,
}: {
  zetaConnectorMockAddress: string;
}) => {
  const isLocalEnvironment = network.name === "hardhat";

  assert(isLocalEnvironment, "This function is only intended to be used in the local environment");

  const Factory = (await ethers.getContractFactory("CrossChainCounter")) as CrossChainCounterFactory;

  const crossChainCounterContract = (await Factory.deploy(zetaConnectorMockAddress)) as CrossChainCounter;

  await crossChainCounterContract.deployed();

  return crossChainCounterContract;
};

export const getCrossChainCounter = async (existingContractAddress?: string) => {
  if (!isNetworkName(network.name)) throw new Error("Invalid network name");
  const isGetExistingContract = typeof existingContractAddress !== "undefined";

  const _networkVariables = networkVariables[network.name];

  const Factory = (await ethers.getContractFactory("CrossChainCounter")) as CrossChainCounterFactory;

  if (isGetExistingContract) {
    console.log("Getting existing CrossChainCounter");
    return Factory.attach(existingContractAddress) as CrossChainCounter;
  }

  console.log("Deploying CrossChainCounter");
  const crossChainCounterContract = (await Factory.deploy(_networkVariables.connectorAddress)) as CrossChainCounter;

  await crossChainCounterContract.deployed();

  return crossChainCounterContract;
};

export const deployZetaConnectorMock = async () => {
  const Factory = (await ethers.getContractFactory("CounterZetaConnectorMock")) as CounterZetaConnectorMockFactory;

  const zetaConnectorMockContract = (await Factory.deploy()) as CounterZetaConnectorMock;

  await zetaConnectorMockContract.deployed();

  return zetaConnectorMockContract;
};
