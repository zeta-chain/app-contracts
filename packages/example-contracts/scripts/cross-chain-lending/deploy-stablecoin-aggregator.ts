// eslint-disable-next-line no-unused-vars
import { getAddress } from "@ethersproject/address";
import { isNetworkName } from "@zetachain/addresses";
import { parseUnits } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import {
  CrossChainLending__factory,
  FakeERC20__factory,
  OracleChainLink__factory,
  StableCoinAggregator__factory
} from "../../typechain-types";

async function main() {
  console.log(`Deploying CrossChainLending...`);
  if (!isNetworkName(network.name)) throw new Error("Invalid network name");

  const accounts = await ethers.getSigners();
  const [deployer] = accounts;

  const stableCoinAggregatorFactory = new StableCoinAggregator__factory(deployer);
  const stableCoinAggregator = await stableCoinAggregatorFactory.deploy();

  console.log(`stableCoinAggregator deployed: ${stableCoinAggregator.address}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
