import dotenv from "dotenv";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { network } from "hardhat";
import { join } from "path";

import { deepCloneSerializable } from "./misc.helpers";

const LOCAL_PKG = "addresses-tools";
const PUBLIC_PKG = "addresses";

const dirname = __dirname.replace(LOCAL_PKG, PUBLIC_PKG);
console.log("dirname", dirname);

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

type NetworkAddresses = Record<ZetaAddress, string>;
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
  zetaTokenConsumerUniV2: true,
};

export const isZetaAddress = (a: string | undefined): a is ZetaAddress => Boolean(zetaAddresses[a as ZetaAddress]);

/**
 * @description Localnet
 */

export type LocalNetworkName = "bsc-localnet" | "eth-localnet" | "hardhat" | "polygon-localnet";
export type ZetaLocalNetworkName = "troy";
type LocalnetAddressGroup = Record<LocalNetworkName, NetworkAddresses>;
export const isLocalNetworkName = (networkName: string): networkName is LocalNetworkName =>
  networkName === "hardhat" ||
  networkName === "eth-localnet" ||
  networkName === "bsc-localnet" ||
  networkName === "polygon-localnet";
export const isZetaLocalnet = (networkName: string | undefined): networkName is ZetaLocalNetworkName =>
  networkName === "troy";

export const getLocalnetList = (): Record<ZetaLocalNetworkName, LocalnetAddressGroup> => ({
  troy: JSON.parse(readFileSync(join(dirname, "./addresses.troy.json"), "utf8")) as LocalnetAddressGroup,
});

/**
 * @description Testnet
 */

export type TestnetNetworkName = "bsc-testnet" | "goerli" | "polygon-mumbai" | "ropsten";
export type ZetaTestnetNetworkName = "athens";
type TestnetAddressGroup = Record<TestnetNetworkName, NetworkAddresses>;
const isTestnetNetworkName = (networkName: string): networkName is TestnetNetworkName =>
  networkName === "goerli" ||
  networkName === "bsc-testnet" ||
  networkName === "polygon-mumbai" ||
  networkName === "ropsten";
export const isZetaTestnet = (networkName: string | undefined): networkName is ZetaTestnetNetworkName =>
  networkName === "athens";

export const getTestnetList = (): Record<ZetaTestnetNetworkName, TestnetAddressGroup> => ({
  athens: JSON.parse(readFileSync(join(dirname, "./addresses.athens.json"), "utf8")) as TestnetAddressGroup,
});

/**
 * @description Mainnet
 */

export type MainnetNetworkName = "eth-mainnet";
export type ZetaMainnetNetworkName = "mainnet";
type MainnetAddressGroup = Record<MainnetNetworkName, NetworkAddresses>;
const isMainnetNetworkName = (networkName: string): networkName is MainnetNetworkName => networkName === "eth-mainnet";
export const isZetaMainnet = (networkName: string | undefined): networkName is ZetaMainnetNetworkName =>
  networkName === "mainnet";

const getMainnetList: () => Record<ZetaMainnetNetworkName, MainnetAddressGroup> = () => ({
  mainnet: JSON.parse(readFileSync(join(dirname, "./addresses.mainnet.json"), "utf8")) as MainnetAddressGroup,
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
    "polygon-localnet": 80001,
    "polygon-mumbai": 80001,
    ropsten: 3,
  };

  return chainIds[networkName];
};

export const isNetworkName = (str: string): str is NetworkName =>
  isLocalNetworkName(str) || isTestnetNetworkName(str) || isMainnetNetworkName(str);

export const isZetaNetworkName = (str: string): str is ZetaNetworkName =>
  isZetaLocalnet(str) || isZetaTestnet(str) || isZetaMainnet(str);

export const getScanVariable = ({ customNetworkName }: { customNetworkName?: string } = {}): string => {
  const networkName = customNetworkName || network.name;
  if (!isNetworkName(networkName)) throw new Error();
  dotenv.config();

  const v = {
    "bsc-localnet": "",
    "bsc-testnet": process.env.BSCSCAN_API_KEY || "",
    "eth-localnet": "",
    "eth-mainnet": process.env.ETHERSCAN_API_KEY || "",
    goerli: process.env.ETHERSCAN_API_KEY || "",
    hardhat: "",
    "polygon-localnet": "",
    "polygon-mumbai": process.env.POLYGONSCAN_API_KEY || "",
    ropsten: process.env.ETHERSCAN_API_KEY || "",
  };

  return v[networkName];
};

export const getExplorerUrl = ({ customNetworkName }: { customNetworkName?: string } = {}): string => {
  const networkName = customNetworkName || network.name;
  if (!isNetworkName(networkName)) throw new Error();
  dotenv.config();

  const v = {
    "bsc-localnet": "",
    "bsc-testnet": "https://testnet.bscscan.com/",
    "eth-localnet": "",
    "eth-mainnet": "https://etherscan.io/",
    goerli: "https://goerli.etherscan.io/",
    hardhat: "",
    "polygon-localnet": "",
    "polygon-mumbai": "https://mumbai.polygonscan.com/",
    ropsten: "https://ropsten.etherscan.io/",
  };

  return v[networkName];
};

const MissingZetaNetworkError = new Error(
  "ZETA_NETWORK is not defined, please set the environment variable (e.g.: ZETA_NETWORK=athens <command>)"
);

export const getAddress = (
  address: ZetaAddress,
  {
    customNetworkName,
    customZetaNetwork,
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

export const saveAddress = (addressName: ZetaAddress, newAddress: string) => {
  const { ZETA_NETWORK } = process.env;
  const { name: networkName } = network;

  if (!ZETA_NETWORK) throw MissingZetaNetworkError;

  console.log(`Updating ${addressName} address on ${ZETA_NETWORK}: ${networkName}.`);

  const filename = join(dirname, `./addresses.${ZETA_NETWORK}.json`);

  if (isZetaLocalnet(ZETA_NETWORK) && isLocalNetworkName(networkName)) {
    const newAddresses: LocalnetAddressGroup = JSON.parse(readFileSync(filename, "utf8"));
    if (typeof newAddresses[networkName][addressName] === "undefined") {
      console.log(
        `The address ${addressName} does not exist, it will get created but make sure to add it to the types.`
      );
    }

    newAddresses[networkName][addressName] = newAddress;

    writeFileSync(filename, JSON.stringify(newAddresses, null, 2));

    console.log(`Updated, new address: ${newAddress}.`);

    return;
  }

  if (isZetaTestnet(ZETA_NETWORK) && isTestnetNetworkName(networkName)) {
    const newAddresses: TestnetAddressGroup = JSON.parse(readFileSync(filename, "utf8"));
    newAddresses[networkName][addressName] = newAddress;

    writeFileSync(filename, JSON.stringify(newAddresses, null, 2));

    console.log(`Updated, new address: ${newAddress}.`);

    return;
  }

  if (isZetaMainnet(ZETA_NETWORK) && isMainnetNetworkName(networkName)) {
    const newAddresses: MainnetAddressGroup = JSON.parse(readFileSync(filename, "utf8"));
    newAddresses[networkName][addressName] = newAddress;

    writeFileSync(filename, JSON.stringify(newAddresses, null, 2));

    console.log(`Updated, new address: ${newAddress}.`);

    return;
  }

  throw new Error(`Invalid ZETA_NETWORK + network combination ${ZETA_NETWORK} ${networkName}.`);
};

export const addNewAddress = (addressName: string, addressValue: string = "") => {
  console.log("dir", dirname);
  if (!addressName) throw new Error("Emtpy address name.");
  console.log("dir", dirname);

  const addressesdirname = join(dirname, `./`);
  const addressesFiles = readdirSync(addressesdirname);

  addressesFiles.forEach((addressesFilename) => {
    const addressPath = join(addressesdirname, addressesFilename);

    const addressesByNetwork = JSON.parse(readFileSync(addressPath, "utf8"));

    Object.keys(addressesByNetwork).forEach((network) => {
      if (!isNetworkName(network)) return;

      addressesByNetwork[network][addressName] = addressValue;
      addressesByNetwork[network] = Object.keys(addressesByNetwork[network])
        .sort()
        .reduce((obj, key) => {
          obj[key as ZetaAddress] = addressesByNetwork[network][key];
          return obj;
        }, {} as NetworkAddresses);
    });

    writeFileSync(addressPath, JSON.stringify(addressesByNetwork, null, 2));
  });

  console.log(`To enable IntelliSense, add the address (${addressName}) to the constants (addresses.helpers.ts).`);
};

export const addNewNetwork = (newNetworkName: string, addTo: ZetaNetworkName[]) => {
  if (!newNetworkName) throw new Error("Emtpy networkName name.");
  const addressesdirname = join(dirname, `./`);
  const addressesFiles = readdirSync(addressesdirname);

  addressesFiles.forEach((addressFilename) => {
    const addressesFilePath = join(addressesdirname, addressFilename);
    /**
     * Gets the Zeta network name using the filename, e.g.: addresses.athens.json -> athens
     */
    const zetaNetworkName = addressFilename.substring(
      addressFilename.indexOf(".") + 1,
      addressFilename.lastIndexOf(".")
    );

    if (!isZetaNetworkName(zetaNetworkName)) throw new Error("Error getting Zeta network name.");

    if (!addTo.includes(zetaNetworkName)) return;

    const fileNetworks = JSON.parse(readFileSync(addressesFilePath, "utf8"));

    if (Boolean(fileNetworks[newNetworkName])) throw new Error("Network already exists.");

    /**
     * Use an existing network object to populate the new one
     */
    const randomNetworkName = Object.keys(fileNetworks)[0];
    fileNetworks[newNetworkName] = deepCloneSerializable(fileNetworks[randomNetworkName]);

    const emptyNewNetworkAddresses = () => {
      Object.keys(fileNetworks[newNetworkName]).forEach((addressName) => {
        fileNetworks[newNetworkName][addressName] = "";
      });
    };
    emptyNewNetworkAddresses();

    /**
     * The types below aren't 100% correct
     */
    const orderedFileNetworks = Object.keys(fileNetworks)
      .sort()
      .reduce((obj, key) => {
        obj[key as LocalNetworkName | MainnetNetworkName | TestnetNetworkName] = fileNetworks[key];
        return obj;
      }, {} as LocalnetAddressGroup & MainnetAddressGroup & TestnetAddressGroup);

    writeFileSync(addressesFilePath, JSON.stringify(orderedFileNetworks, null, 2));
  });

  console.log(`To enable IntelliSense, add the network (${newNetworkName}) to the constants (addresses.helpers.ts).`);
};
