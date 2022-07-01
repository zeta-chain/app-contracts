import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "tsconfig-paths/register";

import { getHardhatConfigNetworks, getHardhatConfigScanners } from "@zetachain/addresses/networks";
import * as dotenv from "dotenv";
import type { HardhatUserConfig } from "hardhat/types";

dotenv.config();

const PRIVATE_KEYS = process.env.PRIVATE_KEY !== undefined ? [`0x${process.env.PRIVATE_KEY}`] : [];

const config: HardhatUserConfig = {
  solidity: "0.8.7",
  etherscan: {
    ...getHardhatConfigScanners(),
  },
  networks: {
    ...getHardhatConfigNetworks(PRIVATE_KEYS),
  },
  paths: {
    sources: "../protocol-contracts/contracts",
    cache: "./cache",
    artifacts: "../protocol-contracts/artifacts",
  },
};

export default config;
