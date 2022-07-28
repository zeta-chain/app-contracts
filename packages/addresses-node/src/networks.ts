import type { NetworksUserConfig } from "hardhat/types";

export const getHardhatConfigNetworks = (PRIVATE_KEYS: string[]): NetworksUserConfig => ({
  "bsc-localnet": {
    gas: 5000000,
    gasPrice: 80000000000,
    url: "http://localhost:8120",
  },
  "bsc-testnet": {
    accounts: PRIVATE_KEYS,
    gas: 5000000,
    gasPrice: 80000000000,
    url: `https://data-seed-prebsc-2-s3.binance.org:8545`,
  },
  "eth-localnet": {
    gas: 2100000,
    gasPrice: 80000000000,
    url: "http://localhost:8100",
  },
  "eth-mainnet": {
    accounts: PRIVATE_KEYS,
    url: "https://api.mycryptoapi.com/eth",
  },
  goerli: {
    accounts: PRIVATE_KEYS,
    gas: 2100000,
    gasPrice: 8000000000,
    url: "https://rpc.goerli.mudit.blog",
  },
  hardhat: {
    chainId: 1337,
    forking: {
      blockNumber: 14672712,
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
    },
  },
  "polygon-localnet": {
    gas: 5000000,
    gasPrice: 80000000000,
    url: "http://localhost:8140",
  },
  "polygon-mumbai": {
    accounts: PRIVATE_KEYS,
    gas: 5000000,
    gasPrice: 80000000000,
    url: "https://polygon-mumbai.chainstacklabs.com",
  },
  ropsten: {
    accounts: PRIVATE_KEYS,
    gas: 9000000,
    gasPrice: 80000000000,
    url: "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
  },
});

export const getHardhatConfigScanners = () => ({
  apiKey: {
    bscTestnet: process.env.BSCSCAN_API_KEY,
    goerli: process.env.ETHERSCAN_API_KEY,
    polygonMumbai: process.env.POYLGONSCAN_API_KEY,
    ropsten: process.env.ETHERSCAN_API_KEY,
  },
});
