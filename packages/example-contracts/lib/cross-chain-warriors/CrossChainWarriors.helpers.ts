import { getAddress } from "@zetachain/addresses";
import assert from "assert";
import { ethers, network } from "hardhat";

import {
  CrossChainWarriors,
  CrossChainWarriors__factory as CrossChainWarriorsFactory,
  CrossChainWarriorsMock,
  CrossChainWarriorsMock__factory as CrossChainWarriorsMockFactory,
  CrossChainWarriorsZetaConnectorMock,
  CrossChainWarriorsZetaConnectorMock__factory as CrossChainWarriorsZetaConnectorMockFactory,
} from "../../typechain-types";
import { isNetworkName } from "../shared/network.constants";

/**
 * @description only for testing or local environment
 */
export const deployCrossChainWarriorsMock = async ({
  customUseEven,
  zetaConnectorMockAddress,
  zetaTokenMockAddress,
}: {
  customUseEven: boolean;
  zetaConnectorMockAddress: string;
  zetaTokenMockAddress: string;
}) => {
  const isLocalEnvironment = network.name === "hardhat";

  assert(isLocalEnvironment, "localDeployCrossChainWarriors is only intended to be used in the local environment");

  const Factory = (await ethers.getContractFactory("CrossChainWarriorsMock")) as CrossChainWarriorsMockFactory;

  const useEven = customUseEven;

  const crossChainWarriorsContract = (await Factory.deploy(
    zetaConnectorMockAddress,
    zetaTokenMockAddress,
    useEven
  )) as CrossChainWarriorsMock;

  await crossChainWarriorsContract.deployed();

  return crossChainWarriorsContract;
};

export const getCrossChainWarriorsArgs = (): [string, string, boolean] => [
  getAddress("connector"),
  getAddress("zetaToken"),
  network.name === "goerli",
];

export const getCrossChainWarriors = async (existingContractAddress?: string) => {
  if (!isNetworkName(network.name)) throw new Error("Invalid network name");
  const isGetExistingContract = typeof existingContractAddress !== "undefined";

  const Factory = (await ethers.getContractFactory("CrossChainWarriors")) as CrossChainWarriorsFactory;

  if (isGetExistingContract) {
    console.log("Getting existing Cross Chain Warriors");
    return Factory.attach(existingContractAddress) as CrossChainWarriors;
  }

  console.log("Deploying Cross Chain Warriors");
  const crossChainWarriorsContract = (await Factory.deploy(
    getCrossChainWarriorsArgs()[0],
    getCrossChainWarriorsArgs()[1],
    getCrossChainWarriorsArgs()[2]
  )) as CrossChainWarriors;

  await crossChainWarriorsContract.deployed();

  return crossChainWarriorsContract;
};

export const deployZetaConnectorMock = async () => {
  const Factory = (await ethers.getContractFactory(
    "CrossChainWarriorsZetaConnectorMock"
  )) as CrossChainWarriorsZetaConnectorMockFactory;

  const zetaConnectorMockContract = (await Factory.deploy()) as CrossChainWarriorsZetaConnectorMock;

  await zetaConnectorMockContract.deployed();

  return zetaConnectorMockContract;
};
