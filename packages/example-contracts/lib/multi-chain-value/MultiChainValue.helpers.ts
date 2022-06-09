import { getAddress } from "@zetachain/addresses";
import assert from "assert";
import { ethers, network } from "hardhat";

import { getContract } from "../../lib/shared/deploy.helpers";
import {
  MultiChainValue,
  MultiChainValue__factory as MultiChainValueFactory,
  MultiChainValueMock,
  MultiChainValueMock__factory as MultiChainValueMockFactory,
  ZetaConnectorMockValue,
  ZetaConnectorMockValue__factory as ZetaConnectorMockValueFactory,
  ZetaEth,
  ZetaEth__factory as ZetaEthFactory,
} from "../../typechain-types";

/**
 * @description only for testing or local environment
 */
export const deployMultiChainValueMock = async ({
  zetaConnectorMockAddress,
  zetaTokenMockAddress,
}: {
  zetaConnectorMockAddress: string;
  zetaTokenMockAddress: string;
}) => {
  const isLocalEnvironment = network.name === "hardhat";

  assert(isLocalEnvironment, "This function is only intended to be used in the local environment");

  const Factory = (await ethers.getContractFactory("MultiChainValueMock")) as MultiChainValueMockFactory;

  const multiChainValueContract = (await Factory.deploy(
    zetaConnectorMockAddress,
    zetaTokenMockAddress
  )) as MultiChainValueMock;

  await multiChainValueContract.deployed();

  return multiChainValueContract;
};

export const getMultiChainValue = (existingContractAddress?: string) =>
  getContract<MultiChainValueFactory, MultiChainValue>({
    contractName: "MultiChainValue",
    ...(existingContractAddress
      ? { existingContractAddress }
      : { deployParams: [getAddress("connector"), getAddress("zetaToken")] }),
  });

export const deployZetaConnectorMock = async () => {
  const Factory = (await ethers.getContractFactory("ZetaConnectorMockValue")) as ZetaConnectorMockValueFactory;

  const zetaConnectorMockContract = (await Factory.deploy()) as ZetaConnectorMockValue;

  await zetaConnectorMockContract.deployed();

  return zetaConnectorMockContract;
};

export const deployZetaEthMock = async () => {
  const Factory = (await ethers.getContractFactory("ZetaEthMock")) as ZetaEthFactory;

  const zetaConnectorMockContract = (await Factory.deploy(100_000)) as ZetaEth;

  await zetaConnectorMockContract.deployed();

  return zetaConnectorMockContract;
};
