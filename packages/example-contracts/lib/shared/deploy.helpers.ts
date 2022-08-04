import { getAddress, NetworkName, ZetaAddress, ZetaNetworkName } from "@zetachain/addresses";
import { getScanVariable } from "@zetachain/addresses-tools";
import { execSync } from "child_process";
import { BaseContract, ContractFactory } from "ethers";
import { ethers } from "hardhat";

import {
  ERC20,
  ERC20__factory as ERC20Factory,
  UniswapV2Router02,
  UniswapV2Router02__factory as UniswapV2Router02Factory,
  ZetaEthMock,
  ZetaEthMock__factory as ZetaEthMockFactory,
  ZetaTokenConsumerUniV2,
  ZetaTokenConsumerUniV2__factory,
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

export const getErc20 = async (existingContractAddress?: string) =>
  getContract<ERC20Factory, ERC20>({
    contractName: "ERC20",
    ...(existingContractAddress ? { existingContractAddress } : { deployParams: ["ERC20Mock", "ERC20Mock"] }),
  });

export const getZetaMock = async () =>
  getContract<ZetaEthMockFactory, ZetaEthMock>({
    contractName: "ZetaEthMock",
    deployParams: ["10000000"],
  });

export const getNow = async () => {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
};

export const getUniswapV2Router02 = async () =>
  getContract<UniswapV2Router02Factory, UniswapV2Router02>({
    contractName: "UniswapV2Router02",
    existingContractAddress: getAddress("uniswapV2Router02", {
      customNetworkName: "eth-mainnet",
      customZetaNetwork: "mainnet",
    }),
  });

export const verifyContract = (
  addressName: ZetaAddress,
  {
    customNetworkName,
    customZetaNetwork,
  }: { customNetworkName?: NetworkName; customZetaNetwork?: ZetaNetworkName } = {}
) => {
  const ZETA_NETWORK = process.env.ZETA_NETWORK || customZetaNetwork;

  console.log(`Verifying ${addressName} address on ${ZETA_NETWORK}: ${customNetworkName}.`);

  const command = `ZETA_NETWORK=${ZETA_NETWORK} SCAN_API_KEY=${getScanVariable()} npx hardhat verify --network ${customNetworkName} --constructor-args lib/args/${addressName}.js ${getAddress(
    addressName
  )}`;

  execSync(command);
};

export const deployZetaTokenConsumerUniV2 = async (zetaToken_: string, uniswapV2Router_: string) =>
  getContract<ZetaTokenConsumerUniV2__factory, ZetaTokenConsumerUniV2>({
    contractName: "ZetaTokenConsumerUniV2",
    ...{ deployParams: [zetaToken_, uniswapV2Router_] },
  });
