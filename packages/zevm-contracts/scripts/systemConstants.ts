import { isNetworkName, NetworkName } from "@zetachain/addresses";

export const SYSTEM_CONTRACT = "0x239e96c8f17C85c30100AC26F635Ea15f23E9c67";

export type ZRC20 = "gETH" | "tBNB" | "tBTC" | "tMATIC";

export const ZRC20Addresses: Record<ZRC20, string> = {
  gETH: "0x91d18e54DAf4F677cB28167158d6dd21F6aB3921",
  tBNB: "0x13A0c5930C028511Dc02665E7285134B6d11A5f4",
  tBTC: "0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb",
  tMATIC: "0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891"
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
