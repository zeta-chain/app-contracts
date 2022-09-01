import { network } from "hardhat";

import athens from "./addresses.athens.json";
import mainnet from "./addresses.mainnet.json";
import troy from "./addresses.troy.json";

export type ZetaAddress =
  | "connector"
  | "crossChainCounter"
  | "crossChainNft"
  | "dai"
  | "immutableCreate2Factory"
  | "multiChainSwap"
  | "multiChainSwapZetaConnector"
  | "multiChainValue"
  | "tss"
  | "tssUpdater"
  | "uniswapV2Router02"
  | "uniswapV3NftManager"
  | "uniswapV3Quoter"
  | "uniswapV3Router"
  | "usdc"
  | "weth9"
  | "zetaToken"
  | "zetaTokenConsumerUniV2";

export type NetworkAddresses = Record<ZetaAddress, string>;
const zetaAddresses: Record<ZetaAddress, boolean> = {
  connector: true,
  crossChainCounter: true,
  crossChainNft: true,
  dai: true,
  immutableCreate2Factory: true,
  multiChainSwap: true,
  multiChainSwapZetaConnector: true,
  multiChainValue: true,
  tss: true,
  tssUpdater: true,
  uniswapV2Router02: true,
  uniswapV3NftManager: true,
  uniswapV3Quoter: true,
  uniswapV3Router: true,
  usdc: true,
  weth9: true,
  zetaToken: true,
  zetaTokenConsumerUniV2: true
};

export const isZetaAddress = (a: string | undefined): a is ZetaAddress => Boolean(zetaAddresses[a as ZetaAddress]);

/**
 * @description Localnet
 */

export type LocalNetworkName = "bsc-localnet" | "eth-localnet" | "hardhat" | "polygon-localnet";
export type ZetaLocalNetworkName = "troy";
export type LocalnetAddressGroup = Record<LocalNetworkName, NetworkAddresses>;
export const isLocalNetworkName = (networkName: string): networkName is LocalNetworkName =>
  networkName === "hardhat" ||
  networkName === "eth-localnet" ||
  networkName === "bsc-localnet" ||
  networkName === "polygon-localnet";
export const isZetaLocalnet = (networkName: string | undefined): networkName is ZetaLocalNetworkName =>
  networkName === "troy";

export const getLocalnetList = (): Record<ZetaLocalNetworkName, LocalnetAddressGroup> => ({
  troy: troy as LocalnetAddressGroup
});

/**
 * @description Testnet
 */

export type TestnetNetworkName = "bsc-testnet" | "goerli" | "klaytn-baobab" | "polygon-mumbai" | "ropsten";
export type ZetaTestnetNetworkName = "athens";
export type TestnetAddressGroup = Record<TestnetNetworkName, NetworkAddresses>;
export const isTestnetNetworkName = (networkName: string): networkName is TestnetNetworkName =>
  networkName === "goerli" ||
  networkName === "bsc-testnet" ||
  networkName === "polygon-mumbai" ||
  networkName === "ropsten" ||
  networkName === "klaytn-baobab";
export const isZetaTestnet = (networkName: string | undefined): networkName is ZetaTestnetNetworkName =>
  networkName === "athens";

export const getTestnetList = (): Record<ZetaTestnetNetworkName, TestnetAddressGroup> => ({
  athens: athens as TestnetAddressGroup
});

/**
 * @description Mainnet
 */

export type MainnetNetworkName = "eth-mainnet" | "klaytn-cypress";
export type ZetaMainnetNetworkName = "mainnet";
export type MainnetAddressGroup = Record<MainnetNetworkName, NetworkAddresses>;
export const isMainnetNetworkName = (networkName: string): networkName is MainnetNetworkName =>
  networkName === "eth-mainnet" || networkName === "klaytn-cypress";
export const isZetaMainnet = (networkName: string | undefined): networkName is ZetaMainnetNetworkName =>
  networkName === "mainnet";

export const getMainnetList = (): Record<ZetaMainnetNetworkName, MainnetAddressGroup> => ({
  mainnet: mainnet as MainnetAddressGroup
});

/**
 * @description Shared
 */

export type NetworkName = LocalNetworkName | MainnetNetworkName | TestnetNetworkName;
export type ZetaNetworkName = ZetaLocalNetworkName | ZetaMainnetNetworkName | ZetaTestnetNetworkName;

export const getChainId = (networkName: NetworkName) => {
  const chainIds: Record<NetworkName, number> = {
    "bsc-localnet": 97,
    "bsc-testnet": 97,
    "eth-localnet": 5,
    "eth-mainnet": 1,
    goerli: 5,
    hardhat: 1337,
    "klaytn-baobab": 1001,
    "klaytn-cypress": 8217,
    "polygon-localnet": 80001,
    "polygon-mumbai": 80001,
    ropsten: 3
  };

  return chainIds[networkName];
};

export const isNetworkName = (str: string): str is NetworkName =>
  isLocalNetworkName(str) || isTestnetNetworkName(str) || isMainnetNetworkName(str);

export const isZetaNetworkName = (str: string): str is ZetaNetworkName =>
  isZetaLocalnet(str) || isZetaTestnet(str) || isZetaMainnet(str);

const MissingZetaNetworkError = new Error(
  "ZETA_NETWORK is not defined, please set the environment variable (e.g.: ZETA_NETWORK=athens <command>)"
);

export const getAddress = (
  address: ZetaAddress,
  {
    customNetworkName,
    customZetaNetwork
  }: { customNetworkName?: NetworkName; customZetaNetwork?: ZetaNetworkName } = {}
): string => {
  const { name: _networkName } = network;
  const networkName = customNetworkName || _networkName;

  const { ZETA_NETWORK: _ZETA_NETWORK } = process.env;
  const ZETA_NETWORK = customZetaNetwork || _ZETA_NETWORK;

  if (!ZETA_NETWORK) throw MissingZetaNetworkError;

  console.log(`Getting ${address} address from ${ZETA_NETWORK}: ${networkName}.`);

  if (isZetaLocalnet(ZETA_NETWORK) && isLocalNetworkName(networkName)) {
    return getLocalnetList()[ZETA_NETWORK][networkName][address];
  }

  if (isZetaTestnet(ZETA_NETWORK) && isTestnetNetworkName(networkName)) {
    return getTestnetList()[ZETA_NETWORK][networkName][address];
  }

  if (isZetaMainnet(ZETA_NETWORK) && isMainnetNetworkName(networkName)) {
    return getMainnetList()[ZETA_NETWORK][networkName][address];
  }

  throw new Error(`Invalid ZETA_NETWORK + network combination ${ZETA_NETWORK} ${networkName}.`);
};
