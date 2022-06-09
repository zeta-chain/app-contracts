import { NetworkName } from "@zetachain/addresses";

type ChainId = 0 | 5 | 97 | 1337;

export type NetworkVariables = {
  CONNECTOR_ADDRESS: string;
  chainId: ChainId;
  crossChainId: ChainId;
  crossChainName: NetworkName | "";
};

export const networkVariables: Record<NetworkName, NetworkVariables> = {
  "bsc-testnet": {
    CONNECTOR_ADDRESS: "0xE626402550fB921E4a47c11568F89dF3496fbEF0",
    chainId: 97,
    crossChainId: 5,
    crossChainName: "goerli",
  },
  goerli: {
    CONNECTOR_ADDRESS: "0x68Bc806414e743D88436AEB771Be387A55B4df70",
    chainId: 5,
    crossChainId: 97,
    crossChainName: "bsc-testnet",
  },
  "polygon-mumbai": {
    CONNECTOR_ADDRESS: "",
    chainId: 0,
    crossChainId: 0,
    crossChainName: "",
  },
  "eth-mainnet": {
    CONNECTOR_ADDRESS: "",
    chainId: 0,
    crossChainId: 0,
    crossChainName: "",
  },
  hardhat: {
    CONNECTOR_ADDRESS: "",
    chainId: 0,
    crossChainId: 0,
    crossChainName: "",
  },
  ropsten: {
    CONNECTOR_ADDRESS: "",
    chainId: 0,
    crossChainId: 0,
    crossChainName: "",
  },
  "eth-localnet": {
    CONNECTOR_ADDRESS: "",
    chainId: 0,
    crossChainId: 0,
    crossChainName: "",
  },
  "bsc-localnet": {
    CONNECTOR_ADDRESS: "",
    chainId: 0,
    crossChainId: 0,
    crossChainName: "",
  },
  "polygon-localnet": {
    CONNECTOR_ADDRESS: "",
    chainId: 0,
    crossChainId: 0,
    crossChainName: "",
  },
};

export const isNetworkName = (str: string): str is NetworkName => str in networkVariables;

export type AddressConstants = Partial<
  Record<
    NetworkName,
    {
      crossChainWarriorsAddress: string;
    }
  >
>;
