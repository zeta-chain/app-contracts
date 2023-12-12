import { getAddress, isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ZetaEth, ZetaEth__factory as ZetaEthFactory } from "@zetachain/protocol-contracts/dist/typechain-types";
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
} from "../../typechain-types";

const networkName = network.name;
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

export const getMultiChainValue = (existingContractAddress?: string) => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  return getContract<MultiChainValueFactory, MultiChainValue>({
    contractName: "MultiChainValue",
    ...(existingContractAddress
      ? { existingContractAddress }
      : { deployParams: [getAddress("connector", networkName), getAddress("zetaToken", networkName)] }),
  });
};

export const deployZetaConnectorMock = async () => {
  const Factory = (await ethers.getContractFactory("ZetaConnectorMockValue")) as ZetaConnectorMockValueFactory;

  const zetaConnectorMockContract = (await Factory.deploy()) as ZetaConnectorMockValue;

  await zetaConnectorMockContract.deployed();

  return zetaConnectorMockContract;
};

export const deployZetaEthMock = async () => {
  const [signer] = await ethers.getSigners();

  const Factory = (await ethers.getContractFactory("ZetaEthMock")) as ZetaEthFactory;

  const zetaConnectorMockContract = (await Factory.deploy(signer.address, 100_000)) as ZetaEth;

  await zetaConnectorMockContract.deployed();

  return zetaConnectorMockContract;
};
