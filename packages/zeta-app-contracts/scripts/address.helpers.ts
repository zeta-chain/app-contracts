import { networks } from "@zetachain/networks";
import { isProtocolNetworkName, ZetaProtocolNetwork } from "@zetachain/protocol-contracts";
import { readFileSync, writeFileSync } from "fs";
import { network } from "hardhat";
import { join } from "path";

import addresses from "../data/addresses.json";

export const getAppAddress = (address: string, network: ZetaProtocolNetwork): string => {
  return (addresses["ccm"] as any)[network][address];
};

export const getChainId = (network: ZetaProtocolNetwork): number => {
  //@ts-ignore
  return networks[network].chain_id;
};

export const saveAddress = (name: string, address: string) => {
  const networkName = network.name;
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  console.log(`Updating ${name} address on ${networkName}.`);

  const filename = join(__dirname, `../data/addresses.json`);

  const newAddresses = JSON.parse(readFileSync(filename, "utf8"));

  newAddresses["ccm"][networkName][name] = address;

  writeFileSync(filename, JSON.stringify(newAddresses, null, 2));
};
