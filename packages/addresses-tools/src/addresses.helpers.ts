import {
  isLocalNetworkName,
  isMainnetNetworkName,
  isNetworkName,
  isTestnetNetworkName,
  isZetaLocalnet,
  isZetaMainnet,
  isZetaNetworkName,
  isZetaTestnet,
  LocalnetAddressGroup,
  LocalNetworkName,
  MainnetAddressGroup,
  MainnetNetworkName,
  NetworkAddresses,
  NetworkName,
  TestnetAddressGroup,
  TestnetNetworkName,
  ZetaAddress,
  ZetaLocalNetworkName,
  ZetaMainnetNetworkName,
  ZetaNetworkName,
  ZetaTestnetNetworkName
} from "@zetachain/addresses";
import dotenv from "dotenv";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { network } from "hardhat";
import { join } from "path";

import { deepCloneSerializable } from "./misc.helpers";

const LOCAL_PKG = "addresses-tools";
const PUBLIC_PKG = "addresses";

const dirname = __dirname.replace(LOCAL_PKG, PUBLIC_PKG);

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
    "klaytn-baobab": "",
    "klaytn-cypress": "",
    "polygon-localnet": "",
    "polygon-mumbai": process.env.POLYGONSCAN_API_KEY || "",
    ropsten: process.env.ETHERSCAN_API_KEY || ""
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
    "klaytn-baobab": "https://baobab.scope.klaytn.com/",
    "klaytn-cypress": "https://scope.klaytn.com/",
    "polygon-localnet": "",
    "polygon-mumbai": "https://mumbai.polygonscan.com/",
    ropsten: "https://ropsten.etherscan.io/"
  };

  return v[networkName];
};

const MissingZetaNetworkError = new Error(
  "ZETA_NETWORK is not defined, please set the environment variable (e.g.: ZETA_NETWORK=athens <command>)"
);

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
  if (!addressName) throw new Error("Emtpy address name.");

  const addressesDirname = join(dirname, `./`);
  const addressesFiles = readdirSync(addressesDirname);

  addressesFiles.forEach(addressesFilename => {
    const addressPath = join(addressesDirname, addressesFilename);

    const addressesByNetwork = JSON.parse(readFileSync(addressPath, "utf8"));

    Object.keys(addressesByNetwork).forEach(network => {
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
  const addressesDirname = join(dirname, `./`);
  const addressesFiles = readdirSync(addressesDirname);

  addressesFiles.forEach(addressFilename => {
    const addressesFilePath = join(addressesDirname, addressFilename);
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
      Object.keys(fileNetworks[newNetworkName]).forEach(addressName => {
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

export const getLocalnetListFromFile = async (): Promise<Record<ZetaLocalNetworkName, LocalnetAddressGroup>> => {
  const troy = await require("./addresses.troy.json");
  return {
    troy: troy as LocalnetAddressGroup
  };
};

export const getTestnetListFromFile = async (): Promise<Record<ZetaTestnetNetworkName, TestnetAddressGroup>> => {
  const athens = await require("./addresses.athens.json");
  return {
    athens: athens as TestnetAddressGroup
  };
};

export const getMainnetListFromFile = async (): Promise<Record<ZetaMainnetNetworkName, MainnetAddressGroup>> => {
  const mainnet = await require("./addresses.mainnet.json");
  return {
    mainnet: mainnet as MainnetAddressGroup
  };
};

export const loadAddressFromFile = async (
  address: ZetaAddress,
  {
    customNetworkName,
    customZetaNetwork
  }: { customNetworkName?: NetworkName; customZetaNetwork?: ZetaNetworkName } = {}
): Promise<string> => {
  const { name: _networkName } = network;
  const networkName = customNetworkName || _networkName;

  const { ZETA_NETWORK: _ZETA_NETWORK } = process.env;
  const ZETA_NETWORK = customZetaNetwork || _ZETA_NETWORK;

  if (!ZETA_NETWORK) throw MissingZetaNetworkError;

  console.log(`Getting ${address} address from ${ZETA_NETWORK}: ${networkName}.`);

  if (isZetaLocalnet(ZETA_NETWORK) && isLocalNetworkName(networkName)) {
    return (await getLocalnetListFromFile())[ZETA_NETWORK][networkName][address];
  }

  if (isZetaTestnet(ZETA_NETWORK) && isTestnetNetworkName(networkName)) {
    return (await getTestnetListFromFile())[ZETA_NETWORK][networkName][address];
  }

  if (isZetaMainnet(ZETA_NETWORK) && isMainnetNetworkName(networkName)) {
    return (await getMainnetListFromFile())[ZETA_NETWORK][networkName][address];
  }

  throw new Error(`Invalid ZETA_NETWORK + network combination ${ZETA_NETWORK} ${networkName}.`);
};
