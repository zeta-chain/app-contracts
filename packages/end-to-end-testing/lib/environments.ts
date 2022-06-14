import { NetworkName, ZetaNetworkName } from "@zetachain/addresses";
import * as dotenv from "dotenv";
import { exit } from "process";

import { EVMChain, ZetaChain } from "./chains";

dotenv.config();

const ZETA_NETWORK = process.env.ZETA_NETWORK;
const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

console.log(ZETA_NETWORK);
console.log(MORALIS_API_KEY);
console.log(ALCHEMY_API_KEY);

let ethName: NetworkName;
let ethRPC: string;
let ethChainId: number;
// let ropstenName: NetworkName;
// let ropstenRPC: string;
// let ropstenChainId: number;
let bscName: NetworkName;
let bscRPC: string;
let bscChainId: number;
let polygonName: NetworkName;
let polygonRPC: string;
let polygonChainId: number;
let zetaRPC: string;
let zetaChainId: number;
let zetaNetwork: ZetaNetworkName;

if (ZETA_NETWORK === "athens") {
  console.log("Using Athens Networks");
  ethName = "goerli";
  ethRPC = `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`;
  ethChainId = 5;
  bscName = "bsc-testnet";
  bscRPC = `https://speedy-nodes-nyc.moralis.io/${MORALIS_API_KEY}/bsc/testnet/archive`;
  bscChainId = 97;
  polygonName = "polygon-mumbai";
  polygonRPC = `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
  polygonChainId = 80001;
  zetaRPC = "https://api.athens.zetachain.com/";
  zetaChainId = 1317;
  zetaNetwork = "athens";
} else if (ZETA_NETWORK === "troy") {
  console.log("Using Troy Networks");
  ethName = "eth-localnet";
  ethRPC = "localhost:8100";
  ethChainId = 5;
  bscName = "bsc-localnet";
  bscRPC = "localhost:8120";
  bscChainId = 97;
  polygonName = "polygon-localnet";
  polygonRPC = "localhost:8140";
  polygonChainId = 80001;
  zetaRPC = "localhost:1317/";
  zetaChainId = 1317;
  zetaNetwork = "troy";
} else {
  console.log("ZETA_NETWORK Not Set. Exiting");
  exit();
}

export const zeta = new ZetaChain(zetaNetwork, zetaRPC, zetaChainId);
export const eth = new EVMChain(ethName, ethRPC, ethChainId, zetaNetwork, {});
export const bsc = new EVMChain(bscName, bscRPC, bscChainId, zetaNetwork, {});
export const polygon = new EVMChain(polygonName, polygonRPC, polygonChainId, zetaNetwork, {});
