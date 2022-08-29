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

  const ERC20Factory = new FakeERC20__factory(deployer);
  const fakeWETH = await ERC20Factory.deploy("WETH", "WETH");
  const fakeWBTC = await ERC20Factory.deploy("WBTC", "WBTC");
  const fakeUSDC = await ERC20Factory.deploy("USDC", "USDC");

  console.log(`fakeWETH deployed: ${fakeWETH.address}`);
  console.log(`fakeWBTC deployed: ${fakeWBTC.address}`);
  console.log(`fakeUSDC deployed: ${fakeUSDC.address}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
