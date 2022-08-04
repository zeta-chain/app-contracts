import { getAddress, isNetworkName } from "@zetachain/addresses";
import { saveAddress } from "@zetachain/addresses-tools";
import { ZetaTokenConsumerUniV2__factory } from "@zetachain/interfaces/typechain-types";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

import { ZETA_CONSUMER_SALT_NUMBER } from "../lib/contracts.constants";
import { deployContractToAddress, saltToHex } from "../lib/ImmutableCreate2Factory/ImmutableCreate2Factory.helpers";

const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS ?? "";

export async function deterministicDeployZetaConsumer() {
  if (!isNetworkName(network.name)) {
    throw new Error(`network.name: ${network.name} isn't supported.`);
  }

  const accounts = await ethers.getSigners();
  const [signer] = accounts;

  const saltNumber = ZETA_CONSUMER_SALT_NUMBER;
  const saltStr = BigNumber.from(saltNumber).toHexString();

  const zetaToken = getAddress("zetaToken");
  const uniswapV2Router02 = getAddress("uniswapV2Router02");

  const immutableCreate2Factory = getAddress("immutableCreate2Factory");

  const salthex = saltToHex(saltStr, DEPLOYER_ADDRESS);
  const constructorTypes = ["address", "address"];
  const constructorArgs = [zetaToken, uniswapV2Router02];

  const contractBytecode = ZetaTokenConsumerUniV2__factory.bytecode;

  const { address } = await deployContractToAddress({
    constructorArgs,
    constructorTypes,
    contractBytecode,
    factoryAddress: immutableCreate2Factory,
    salt: salthex,
    signer,
  });

  saveAddress("zetaTokenConsumerUniV2", address);
  console.log("Deployed ZetaConsumer. Address:", address);
}

if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  deterministicDeployZetaConsumer()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
