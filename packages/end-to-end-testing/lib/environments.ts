import { NetworkName, ZetaNetworkName } from "@zetachain/addresses";
import * as dotenv from "dotenv";
import { exit } from "process";

import { EVMChain, ZetaChain } from "./chains";
import { getHardhatConfigNetworks } from "@zetachain/addresses/src/networks";
import type { NetworksUserConfig, HttpNetworkUserConfig } from "hardhat/types";

dotenv.config();

const ZETA_NETWORK = process.env.ZETA_NETWORK;
let ethName: NetworkName;
let bscName: NetworkName;
let polygonName: NetworkName;
let zetaRPC: string;
let zetaChainId: number;
let zetaNetwork: ZetaNetworkName;

const PRIVATE_KEYS =
  process.env.PRIVATE_KEY !== undefined ? [`0x${process.env.PRIVATE_KEY}`, `0x${process.env.TSS_PRIVATE_KEY}`] : [];
let networks: NetworksUserConfig = getHardhatConfigNetworks(PRIVATE_KEYS);


if (ZETA_NETWORK === "athens") {
  console.log("Using Athens Networks");
  zetaNetwork = "athens";
  zetaRPC = "https://api.athens.zetachain.com/";
  zetaChainId = 1317;
  ethName = "goerli";
  bscName = "bsc-testnet";
  polygonName = 'polygon-mumbai';
} else if (ZETA_NETWORK === "troy") {
  console.log("Using Troy Networks");
  zetaNetwork = "troy";
  zetaRPC = "localhost:1317/";
  zetaChainId = 1317;
  ethName = "eth-localnet";
  bscName = "bsc-localnet";
  polygonName = "polygon-localnet";
} else {
  console.log("ZETA_NETWORK Not Set. Exiting");
  exit();
}

const ethConfig = networks[ethName] as HttpNetworkUserConfig;
const bscConfig = networks[bscName] as HttpNetworkUserConfig;
const polygonConfig = networks[polygonName] as HttpNetworkUserConfig;

export const zeta = new ZetaChain(zetaNetwork, zetaRPC, zetaChainId);
export const eth = new EVMChain(ethName, ethConfig.url as string, ethConfig.chainId as number, zetaNetwork, {});
export const bsc = new EVMChain(bscName, bscConfig.url as string, bscConfig.chainId as number, zetaNetwork, {});
export const polygon = new EVMChain(polygonName, polygonConfig.url as string, polygonConfig.chainId as number, zetaNetwork, {});
