import { isNetworkName } from "@zetachain/addresses";
import { saveAddress } from "@zetachain/addresses-tools";
import { ZetaTokenConsumerUniV3__factory } from "@zetachain/interfaces/typechain-types";
import { ethers, network } from "hardhat";

import { getAddress } from "../lib/address.helpers";

export async function deterministicDeployZetaConsumer() {
  if (!isNetworkName(network.name)) {
    throw new Error(`network.name: ${network.name} isn't supported.`);
  }

  const accounts = await ethers.getSigners();
  const [signer] = accounts;

  const zetaToken = getAddress("zetaToken");
  const uniswapV3Router = getAddress("uniswapV3Router");
  const quoter = getAddress("uniswapV3Quoter");
  const WETH9Address = getAddress("weth9");
  const zetaPoolFee = 500;
  const tokenPoolFee = 3000;

  console.log([zetaToken, uniswapV3Router, quoter, WETH9Address, zetaPoolFee, tokenPoolFee]);

  const Factory = new ZetaTokenConsumerUniV3__factory(signer);
  const contract = await Factory.deploy(zetaToken, uniswapV3Router, quoter, WETH9Address, zetaPoolFee, tokenPoolFee);
  await contract.deployed();
  const address = contract.address;

  saveAddress("zetaTokenConsumerUniV3", address);
  console.log("Deployed ZetaConsumer. Address:", address);
}

if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  deterministicDeployZetaConsumer()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
