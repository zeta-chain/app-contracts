import { networks } from "@zetachain/networks";
import { ZetaProtocolNetwork } from "@zetachain/protocol-contracts";
import protocolAddresses from "@zetachain/protocol-contracts/dist/data/addresses.json";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

import addresses from "../data/addresses.json";

export const getZEVMAppAddress = (address: string): string => {
  return (addresses["zevm"] as any)["zeta_testnet"][address];
};

export const getChainId = (network: ZetaProtocolNetwork): number => {
  //@ts-ignore
  return networks[network].chain_id;
};

export const getGasSymbolByNetwork = (network: ZetaProtocolNetwork): number => {
  //@ts-ignore
  return networks[network].gas_symbol;
};

export const getSystemContractAddress = () => {
  return protocolAddresses["zevm"]["zeta_testnet"].systemContract;
};

export const saveAddress = (name: string, address: string, networkName: ZetaProtocolNetwork) => {
  console.log(`Updating ${name} address on ${networkName}.`);

  const filename = join(__dirname, `../data/addresses.json`);

  const newAddresses = JSON.parse(readFileSync(filename, "utf8"));

  newAddresses["zevm"][networkName][name] = address;

  writeFileSync(filename, JSON.stringify(newAddresses, null, 2));
};
