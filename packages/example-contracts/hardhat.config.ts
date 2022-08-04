import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "tsconfig-paths/register";

import { getHardhatConfigNetworks, getHardhatConfigScanners } from "@zetachain/addresses-tools/src/networks";
import * as dotenv from "dotenv";
import type { HardhatUserConfig } from "hardhat/types";

dotenv.config();

const PRIVATE_KEYS = process.env.PRIVATE_KEY !== undefined ? [`0x${process.env.PRIVATE_KEY}`] : [];

const config: HardhatUserConfig = {
  etherscan: {
    ...getHardhatConfigScanners(),
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS !== undefined,
  },
  networks: {
    ...getHardhatConfigNetworks(PRIVATE_KEYS),
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
