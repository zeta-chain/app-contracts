import { networks } from "@zetachain/networks";
import { isProtocolNetworkName, isTestnetNetwork, ZetaProtocolNetwork } from "@zetachain/protocol-contracts";
import protocolAddresses from "@zetachain/protocol-contracts/dist/data/addresses.json";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

import addresses from "../data/addresses.json";

export const getZEVMAppAddress = (address: string, networkName: string): string => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  //@ts-ignore
  const isTestnet = isTestnetNetwork(networkName);
  const zetaChain = isTestnet ? "zeta_testnet" : "zeta_mainnet";

  return (addresses["zevm"] as any)[zetaChain][address];
};

export const getChainId = (network: ZetaProtocolNetwork): number => {
  //@ts-ignore
  return networks[network].chain_id;
};

export const getGasSymbolByNetwork = (network: ZetaProtocolNetwork): number => {
  //@ts-ignore
  return networks[network].gas_symbol;
};

export const getSystemContractAddress = (networkName: string) => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  //@ts-ignore
  const isTestnet = isTestnetNetwork(networkName);
  const zetaChain = isTestnet ? "zeta_testnet" : "zeta_mainnet";

  return protocolAddresses["zevm"][zetaChain].systemContract;
};

export const saveAddress = (name: string, address: string, networkName: ZetaProtocolNetwork) => {
  console.log(`Updating ${name} address on ${networkName}.`);

  const filename = join(__dirname, `../data/addresses.json`);

  const newAddresses = JSON.parse(readFileSync(filename, "utf8"));

  newAddresses["zevm"][networkName][name] = address;

  writeFileSync(filename, JSON.stringify(newAddresses, null, 2));
};
