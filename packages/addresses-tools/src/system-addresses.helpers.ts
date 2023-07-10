import { NetworkName } from "@zetachain/addresses";
import { getAddress, getZRC20Address as getZRC20AddressFromProtocol } from "@zetachain/protocol-contracts/dist/lib";

export type AthensVersion = "A2" | "A3";

export type ZRC20 = "gETH" | "tBNB" | "tBTC" | "tMATIC";

//@dev: Legacy addresses to make it simple if is needed to run a script pointing to Athens2
const ATHENS2_SYSTEM_CONTRACT = "0x239e96c8f17C85c30100AC26F635Ea15f23E9c67";
const ATHENS2_ZRC20Addresses: Record<ZRC20, string> = {
  gETH: "0x91d18e54DAf4F677cB28167158d6dd21F6aB3921",
  tBNB: "0x13A0c5930C028511Dc02665E7285134B6d11A5f4",
  tBTC: "0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb",
  tMATIC: "0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891"
};

export const getSystemContractAddress = (version: AthensVersion = "A3") => {
  if (version === "A2") {
    return ATHENS2_SYSTEM_CONTRACT;
  }
  return getAddress("systemContract", "zeta_testnet");
};

export const getZRC20Address = (version: AthensVersion = "A3") => {
  if (version === "A2") {
    return ATHENS2_ZRC20Addresses;
  }
  const ZRC20Addresses: Record<ZRC20, string> = {
    gETH: getZRC20AddressFromProtocol("bsc_testnet"),
    tBNB: getZRC20AddressFromProtocol("bsc_testnet"),
    // tBTC: getZRC20AddressFromProtocol(""),
    tBTC: "0x0",
    tMATIC: getZRC20AddressFromProtocol("mumbai_testnet")
  };

  return ZRC20Addresses;
};

export type SwappableNetwork = Extract<NetworkName, "bitcoin-test" | "bsc-testnet" | "goerli" | "polygon-mumbai">;

export const isSwappableNetwork = (network: string): network is SwappableNetwork =>
  network === "bitcoin-test" || network === "bsc-testnet" || network === "goerli" || network === "polygon-mumbai";

export const ChainToZRC20: Record<SwappableNetwork, ZRC20> = {
  "bitcoin-test": "tBTC",
  "bsc-testnet": "tBNB",
  goerli: "gETH",
  "polygon-mumbai": "tMATIC"
};
