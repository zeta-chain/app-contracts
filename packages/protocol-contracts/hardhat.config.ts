import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "tsconfig-paths/register";
import "hardhat-abi-exporter";

import { getHardhatConfigNetworks, getHardhatConfigScanners } from "@zetachain/addresses-tools/networks";
import * as dotenv from "dotenv";
import type { HardhatUserConfig } from "hardhat/types";

dotenv.config();

const PRIVATE_KEYS =
  process.env.PRIVATE_KEY !== undefined ? [`0x${process.env.PRIVATE_KEY}`, `0x${process.env.TSS_PRIVATE_KEY}`] : [];

const config: HardhatUserConfig = {
  abiExporter: [
    {
      format: "json",
      path: "../interfaces/abi/json",
      runOnCompile: true,
    },
  ],
  etherscan: {
    ...getHardhatConfigScanners(),
  },
  networks: {
    ...getHardhatConfigNetworks(PRIVATE_KEYS),
  },
  solidity: {
    compilers: [
      { version: "0.5.10" /** For create2 factory */ },
      { version: "0.6.6" /** For uniswap v2 */ },
      { version: "0.7.6" /** For uniswap v3 */ },
      { version: "0.8.7" },
    ],
  },
  typechain: {
    alwaysGenerateOverloads: false,
    outDir: "../interfaces/typechain-types",
  },
  
};

export default config;
