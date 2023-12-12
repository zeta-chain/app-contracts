import { BaseContract, ContractFactory } from "ethers";
import { ethers } from "hardhat";

import { ERC20, ERC20__factory as ERC20Factory } from "../../typechain-types";

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
