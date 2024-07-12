import "@nomicfoundation/hardhat-verify";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "tsconfig-paths/register";

import { getHardhatConfigNetworks } from "@zetachain/networks";
import * as dotenv from "dotenv";
import type { HardhatUserConfig } from "hardhat/types";

dotenv.config();

const PRIVATE_KEYS = process.env.PRIVATE_KEY !== undefined ? [`0x${process.env.PRIVATE_KEY}`] : [];

const config: HardhatUserConfig = {
  //@ts-ignore
  etherscan: {
    apiKey: {
      // BSC
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
      // ETH
      goerli: process.env.ETHERSCAN_API_KEY || "",
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      zeta_mainnet: "NO_TOKEN",
      zeta_testnet: "NO_TOKEN",
    },
    //@ts-ignore
    customChains: [
      {
        chainId: 7000,
        network: "zeta_mainnet",
        urls: {
          apiURL: "https://zetachain.blockscout.com/api",
          browserURL: "https://zetachain.blockscout.com",
        },
      },
      {
        chainId: 7001,
        network: "zeta_testnet",
        urls: {
          apiURL: "https://zetachain-athens-3.blockscout.com/api",
          browserURL: "https://zetachain-athens-3.blockscout.com",
        },
      },
    ],
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS !== undefined,
  },
  networks: {
    ...getHardhatConfigNetworks(),
  },
  solidity: {
    compilers: [
      { version: "0.5.10" /** For create2 factory */ },
      { version: "0.6.6" /** For uniswap v2 */ },
      { version: "0.8.7" },
    ],
    settings: {
      /**
       * @see {@link https://smock.readthedocs.io/en/latest/getting-started.html}
       */
      outputSelection: {
        "*": {
          "*": ["storageLayout"],
        },
      },
    },
  },
};

export default config;
