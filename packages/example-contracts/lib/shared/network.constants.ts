import { NetworkName } from "@zetachain/addresses";

type ChainId = 0 | 5 | 97 | 1001 | 1337 | 80001;

export type NetworkVariables = {
  chainId: ChainId;
  connectorAddress: string;
  crossChainId: ChainId;
  crossChainName: NetworkName | "";
};

export const networkVariables: Record<NetworkName, NetworkVariables> = {
  athens: {
    chainId: 0,
    connectorAddress: "",
    crossChainId: 0,
    crossChainName: ""
  },
  "bitcoin-test": {
    chainId: 0,
    connectorAddress: "",
    crossChainId: 0,
    crossChainName: ""
  },
  "bsc-localnet": {
    chainId: 0,
    connectorAddress: "",
    crossChainId: 0,
    crossChainName: ""
  },
  "bsc-testnet": {
    chainId: 97,
    connectorAddress: "0xE626402550fB921E4a47c11568F89dF3496fbEF0",
    crossChainId: 5,
    crossChainName: "goerli"
  },
  "eth-localnet": {
    chainId: 0,
    connectorAddress: "",
    crossChainId: 0,
    crossChainName: ""
  },
  "eth-mainnet": {
    chainId: 0,
    connectorAddress: "",
    crossChainId: 0,
    crossChainName: ""
  },
  goerli: {
    chainId: 5,
    connectorAddress: "0x68Bc806414e743D88436AEB771Be387A55B4df70",
    crossChainId: 97,
    crossChainName: "bsc-testnet"
  },
  hardhat: {
    chainId: 0,
    connectorAddress: "",
    crossChainId: 0,
    crossChainName: ""
  },
  "klaytn-baobab": {
    chainId: 1001,
    connectorAddress: "",
    crossChainId: 5,
    crossChainName: "goerli"
  },
  "klaytn-cypress": {
    chainId: 0,
    connectorAddress: "",
    crossChainId: 0,
    crossChainName: ""
  },
  "polygon-localnet": {
    chainId: 0,
    connectorAddress: "",
    crossChainId: 0,
    crossChainName: ""
  },
  "polygon-mumbai": {
    chainId: 0,
    connectorAddress: "",
    crossChainId: 0,
    crossChainName: ""
  },
  ropsten: {
    chainId: 0,
    connectorAddress: "",
    crossChainId: 0,
    crossChainName: ""
  }
};

export const isNetworkName = (str: string): str is NetworkName => str in networkVariables;
export const isEthNetworkName = (networkName: string) =>
  networkName === "eth-localnet" || networkName === "goerli" || networkName === "eth-mainnet";

export type AddressConstants = Partial<
  Record<
    NetworkName,
    {
      crossChainWarriorsAddress: string;
    }
  >
>;
