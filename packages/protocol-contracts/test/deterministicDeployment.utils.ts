import { Provider, TransactionReceipt } from "@ethersproject/providers";
import { ethers } from "ethers";

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

export const isContract = async (address: string, provider: Provider) => {
  const code = await provider.getCode(address);
  return code.slice(2).length > 0;
};
