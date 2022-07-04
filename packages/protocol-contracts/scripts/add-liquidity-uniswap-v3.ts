import { parseEther } from "@ethersproject/units";
import { getAddress } from "@zetachain/addresses";
import { ethers } from "hardhat";

import { createPoolV3 } from "../test/uniswapv3.helper";

async function main() {
  const [deployer] = await ethers.getSigners();

  const zetaTokenAddr = getAddress("zetaToken");

  // const uniswapV2RouterAddr = getAddress("uniswapV2Router02", {
  //   customNetworkName: "eth-mainnet",
  //   customZetaNetwork: "mainnet",
  // });

  // await swapToken(deployer, DAI, parseEther("10000"));

  await createPoolV3(zetaTokenAddr, parseEther("5"), parseEther("1"), deployer);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
