import { getAddress, isNetworkName, saveAddress } from "@zetachain/addresses";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

import { deployContractToAddress, saltToHex } from "../../lib/shared/ImmutableCreate2Factory.helpers";
import { isEthNetworkName } from "../../lib/shared/network.constants";
import { MultiChainSwapBase__factory } from "../@zetachain/interfaces/typechain-types";
import { setMultiChainSwapCrossChainData } from "./set-cross-chain-data";

const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS ?? "";
const SALT_NUMBER = "0";

export async function deterministicDeployMultiChainSwap() {
  if (!isNetworkName(network.name)) {
    throw new Error(`network.name: ${network.name} isn't supported.`);
  }

  const accounts = await ethers.getSigners();
  const [signer] = accounts;

  const saltNumber = SALT_NUMBER;
  const saltStr = BigNumber.from(saltNumber).toHexString();

  const connector = getAddress("connector");
  const zetaToken = getAddress("zetaToken");
  const uniswapV2Router02 = getAddress("uniswapV2Router02");

  const immutableCreate2Factory = getAddress("immutableCreate2Factory");

  const salthex = saltToHex(saltStr, DEPLOYER_ADDRESS);

  const constructorTypes = ["address", "address", "address"];
  const constructorArgs = [connector, zetaToken, uniswapV2Router02];

  const contractBytecode = MultiChainSwapBase__factory.bytecode;

  const { address } = await deployContractToAddress({
    constructorArgs,
    constructorTypes,
    contractBytecode,
    factoryAddress: immutableCreate2Factory,
    salt: salthex,
    signer,
  });

  saveAddress("multiChainSwap", address);
  console.log("Deployed MultiChainSwap. Address:", address);
}

if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  deterministicDeployMultiChainSwap()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
