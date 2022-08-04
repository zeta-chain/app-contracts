import { Provider, TransactionReceipt } from "@ethersproject/providers";
import { ethers, Signer } from "ethers";

import { ImmutableCreate2Factory__factory } from "../@zetachain/interfaces/typechain-types";

export const buildBytecode = (constructorTypes: any[], constructorArgs: any[], contractBytecode: string) =>
  `${contractBytecode}${encodeParams(constructorTypes, constructorArgs).slice(2)}`;

export const buildCreate2Address = (saltHex: string, byteCode: string, factoryAddress: string) => {
  const payload = ethers.utils.keccak256(
    `0x${["ff", factoryAddress, saltHex, ethers.utils.keccak256(byteCode)].map((x) => x.replace(/0x/, "")).join("")}`
  );

  return `0x${payload.slice(-40)}`.toLowerCase();
};

export const numberToUint256 = (value: number) => {
  const hex = value.toString(16);
  return `0x${"0".repeat(64 - hex.length)}${hex}`;
};

export const saltToHex = (salt: string, signerAddress: string) => {
  let salthex = ethers.utils.formatBytes32String(salt);
  return `${signerAddress}${salthex.slice(2)}`.substring(0, salthex.length);
};

export const encodeParam = (dataType: any, data: any) => {
  const abiCoder = ethers.utils.defaultAbiCoder;
  return abiCoder.encode([dataType], [data]);
};

export const encodeParams = (dataTypes: any[], data: any[]) => {
  const abiCoder = ethers.utils.defaultAbiCoder;
  return abiCoder.encode(dataTypes, data);
};

export async function deployContractToAddress({
  factoryAddress,
  salt,
  contractBytecode,
  constructorTypes = [] as string[],
  constructorArgs = [] as any[],
  signer,
}: {
  constructorArgs?: any[];
  constructorTypes?: string[];
  contractBytecode: string;
  factoryAddress: string;
  salt: string;
  signer: Signer;
}) {
  const factory = ImmutableCreate2Factory__factory.connect(factoryAddress, signer);

  const bytecode = buildBytecode(constructorTypes, constructorArgs, contractBytecode);

  const computedAddr = await factory.findCreate2Address(salt, bytecode);

  const tx = await factory.safeCreate2(salt, bytecode, {
    gasLimit: 6000000,
  });
  const result = await tx.wait();

  return {
    address: computedAddr as string,
    receipt: result as TransactionReceipt,
    txHash: result.transactionHash as string,
  };
}

/**
 * Determines if there's a contract deployed on the provided address.
 */
export async function isDeployed(address: string, provider: Provider) {
  const code = await provider.getCode(address);
  return code.slice(2).length > 0;
}
