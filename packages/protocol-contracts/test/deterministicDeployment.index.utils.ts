import { Provider, TransactionReceipt } from "@ethersproject/providers";
import assert from "assert";
import { ethers, Signer } from "ethers";

import { ImmutableCreate2Factory__factory } from "../typechain-types";
import { buildBytecode } from "./deterministicDeployment.utils";

export async function deployContract({
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

  const addr = result.logs[0].address;

  assert.strictEqual(addr, computedAddr);

  return {
    address: computedAddr as string,
    receipt: result as TransactionReceipt,
    txHash: result.transactionHash as string,
  };
}

/**
 * Calculate create2 address of a contract.
 *
 * Calculates deterministic create2 address locally.
 *
 */
// export function getCreate2Address({
//   salt,
//   contractBytecode,
//   constructorTypes = [] as string[],
//   constructorArgs = [] as any[],
//   signerAddress,
//   factoryAddress,
// }: {
//   constructorArgs?: any[];
//   constructorTypes?: string[];
//   contractBytecode: string;
//   factoryAddress: string;
//   salt: string;
//   signerAddress: string;
// }) {
//   return buildCreate2Address(
//     saltToHex(salt, signerAddress),
//     buildBytecode(constructorTypes, constructorArgs, contractBytecode),
//     factoryAddress
//   );
// }

/**
 * Determine if a given contract is deployed.
 *
 * Determines if a given contract is deployed at the address provided.
 *
 */
export async function isDeployed(address: string, provider: Provider) {
  const code = await provider.getCode(address);
  return code.slice(2).length > 0;
}
