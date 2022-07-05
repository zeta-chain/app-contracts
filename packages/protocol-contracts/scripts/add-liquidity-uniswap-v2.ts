import { parseEther } from "@ethersproject/units";
import { getAddress } from "@zetachain/addresses";
import { ethers } from "hardhat";

import { addZetaEthLiquidityUniV2 } from "../test/uniswapV2.helpers";

async function main() {
  const [deployer] = await ethers.getSigners();

  const zetaTokenAddr = getAddress("zetaToken");
  const uniswapRouterV2Address = getAddress("uniswapV2Router02", {
    customNetworkName: "eth-mainnet",
    customZetaNetwork: "mainnet",
  });

  await addZetaEthLiquidityUniV2({
    ETHToAdd: parseEther("1"),
    deployer,
    uniswapRouterV2Address,
    zetaToAdd: parseEther("0.005"),
    zetaTokenAddress: zetaTokenAddr,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
