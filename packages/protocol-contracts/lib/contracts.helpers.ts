import { BaseContract, ContractFactory } from "ethers";
import { ethers } from "hardhat";

import {
  ImmutableCreate2Factory,
  ImmutableCreate2Factory__factory,
  ZetaConnectorBase,
  ZetaConnectorBase__factory as ZetaConnectorBaseFactory,
  ZetaConnectorEth,
  ZetaConnectorEth__factory as ZetaConnectorEthFactory,
  ZetaConnectorNonEth,
  ZetaConnectorNonEth__factory as ZetaConnectorNonEthFactory,
  ZetaEth,
  ZetaEth__factory as ZetaEthFactory,
  ZetaInteractorMock,
  ZetaInteractorMock__factory as ZetaInteractorMockFactory,
  ZetaNonEth,
  ZetaNonEth__factory as ZetaNonEthFactory,
  ZetaReceiverMock,
  ZetaReceiverMock__factory as ZetaReceiverMockFactory,
  ZetaTokenConsumerUniV2,
  ZetaTokenConsumerUniV2__factory as ZetaTokenConsumerUniV2Factory,
  ZetaTokenConsumerUniV3,
  ZetaTokenConsumerUniV3__factory as ZetaTokenConsumerUniV3Factory,
} from "../typechain-types";

export const isEthNetworkName = (networkName: string) =>
  networkName === "eth-localnet" || networkName === "goerli" || networkName === "eth-mainnet";

export const deployZetaConnectorBase = async ({ args }: { args: Parameters<ZetaConnectorBaseFactory["deploy"]> }) => {
  const Factory = (await ethers.getContractFactory("ZetaConnectorBase")) as ZetaConnectorBaseFactory;

  const zetaConnectorContract = (await Factory.deploy(...args)) as ZetaConnectorBase;

  await zetaConnectorContract.deployed();

  return zetaConnectorContract;
};

export const deployZetaConnectorEth = async ({ args }: { args: Parameters<ZetaConnectorEthFactory["deploy"]> }) => {
  const Factory = (await ethers.getContractFactory("ZetaConnectorEth")) as ZetaConnectorEthFactory;

  const zetaConnectorContract = (await Factory.deploy(...args)) as ZetaConnectorEth;

  await zetaConnectorContract.deployed();

  return zetaConnectorContract;
};

export const deployZetaConnectorNonEth = async ({
  args,
}: {
  args: Parameters<ZetaConnectorNonEthFactory["deploy"]>;
}) => {
  const Factory = (await ethers.getContractFactory("ZetaConnectorNonEth")) as ZetaConnectorNonEthFactory;

  const zetaConnectorContract = (await Factory.deploy(...args)) as ZetaConnectorNonEth;

  await zetaConnectorContract.deployed();

  return zetaConnectorContract;
};

export const deployZetaReceiverMock = async () => {
  const Factory = (await ethers.getContractFactory("ZetaReceiverMock")) as ZetaReceiverMockFactory;

  const zetaReceiverMock = (await Factory.deploy()) as ZetaReceiverMock;

  await zetaReceiverMock.deployed();

  return zetaReceiverMock;
};

export const deployZetaEth = async ({ args }: { args: Parameters<ZetaEthFactory["deploy"]> }) => {
  const Factory = (await ethers.getContractFactory("ZetaEth")) as ZetaEthFactory;

  const zetaEthContract = (await Factory.deploy(...args)) as ZetaEth;

  await zetaEthContract.deployed();

  return zetaEthContract;
};

export const deployZetaNonEth = async ({ args }: { args: Parameters<ZetaNonEthFactory["deploy"]> }) => {
  const Factory = (await ethers.getContractFactory("ZetaNonEth")) as ZetaNonEthFactory;

  const zetaNonEthContract = (await Factory.deploy(...args)) as ZetaNonEth;

  await zetaNonEthContract.deployed();

  return zetaNonEthContract;
};

export const deployImmutableCreate2Factory = async () => {
  const Factory = (await ethers.getContractFactory("ImmutableCreate2Factory")) as ImmutableCreate2Factory__factory;

  const ImmutableCreate2FactoryContract = (await Factory.deploy()) as ImmutableCreate2Factory;

  await ImmutableCreate2FactoryContract.deployed();

  return ImmutableCreate2FactoryContract;
};

export const getZetaConnectorEth = async (params: GetContractParams<ZetaConnectorEthFactory>) =>
  getContract<ZetaConnectorEthFactory, ZetaConnectorEth>({
    contractName: "ZetaConnectorEth",
    ...params,
  });

export const getZetaConnectorNonEth = async (params: GetContractParams<ZetaConnectorNonEthFactory>) =>
  getContract<ZetaConnectorNonEthFactory, ZetaConnectorNonEth>({
    contractName: "ZetaConnectorNonEth",
    ...params,
  });

export const getZetaFactoryNonEth = async (params: GetContractParams<ZetaNonEthFactory>) =>
  await getContract<ZetaNonEthFactory, ZetaNonEth>({
    contractName: "ZetaNonEth",
    ...params,
  });

export const getZetaFactoryEth = async (params: GetContractParams<ZetaEthFactory>) =>
  await getContract<ZetaEthFactory, ZetaEth>({
    contractName: "ZetaNonEth",
    ...params,
  });

export const getZetaInteractorMock = async (zetaToken: string) =>
  getContract<ZetaInteractorMockFactory, ZetaInteractorMock>({
    contractName: "ZetaInteractorMock",
    deployParams: [zetaToken],
  });

export const getZetaTokenConsumerUniV2Strategy = async (params: GetContractParams<ZetaTokenConsumerUniV2Factory>) =>
  getContract<ZetaTokenConsumerUniV2Factory, ZetaTokenConsumerUniV2>({
    contractName: "ZetaTokenConsumerUniV2",
    ...params,
  });

export const getZetaTokenConsumerUniV3Strategy = async (params: GetContractParams<ZetaTokenConsumerUniV3Factory>) =>
  getContract<ZetaTokenConsumerUniV3Factory, ZetaTokenConsumerUniV3>({
    contractName: "ZetaTokenConsumerUniV3",
    ...params,
  });

export type GetContractParams<Factory extends ContractFactory> =
  | {
      deployParams: Parameters<Factory["deploy"]>;
      existingContractAddress?: null;
    }
  | {
      deployParams?: null;
      existingContractAddress: string;
    };

export const getContract = async <Factory extends ContractFactory, Contract extends BaseContract>({
  contractName,
  deployParams,
  existingContractAddress,
}: GetContractParams<Factory> & { contractName: string }): Promise<Contract> => {
  const ContractFactory = (await ethers.getContractFactory(contractName)) as Factory;

  const isGetExistingContract = Boolean(existingContractAddress);
  if (isGetExistingContract) {
    console.log("Getting existing contract from address:", existingContractAddress);
    return ContractFactory.attach(existingContractAddress!) as Contract;
  }

  const contract = (await ContractFactory.deploy(...deployParams!)) as Contract;
  await contract.deployed();

  return contract;
};
