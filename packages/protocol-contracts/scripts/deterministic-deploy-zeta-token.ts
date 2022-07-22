import { getAddress, isNetworkName, saveAddress } from "@zetachain/addresses";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

import {
  ZETA_INITIAL_SUPPLY,
  ZETA_TOKEN_SALT_NUMBER_ETH,
  ZETA_TOKEN_SALT_NUMBER_NON_ETH,
} from "../lib/contracts.constants";
import { isEthNetworkName } from "../lib/contracts.helpers";
import { deployContractToAddress, saltToHex } from "../lib/ImmutableCreate2Factory/ImmutableCreate2Factory.helpers";
import { ZetaEth__factory, ZetaNonEth__factory } from "../typechain-types";

const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS ?? "";

export async function deterministicDeployZetaToken() {
  if (!isNetworkName(network.name)) {
    throw new Error(`network.name: ${network.name} isn't supported.`);
  }

  const accounts = await ethers.getSigners();
  const [signer] = accounts;

  const saltNumber = isEthNetworkName(network.name) ? ZETA_TOKEN_SALT_NUMBER_ETH : ZETA_TOKEN_SALT_NUMBER_NON_ETH;
  const saltStr = BigNumber.from(saltNumber).toHexString();

  const tss = getAddress("tss");
  const tssUpdater = getAddress("tssUpdater");
  const immutableCreate2Factory = getAddress("immutableCreate2Factory");

  const salthex = saltToHex(saltStr, DEPLOYER_ADDRESS);

  let constructorTypes;
  let constructorArgs;
  let contractBytecode;

  if (isEthNetworkName(network.name)) {
    constructorTypes = ["uint256"];
    constructorArgs = [ZETA_INITIAL_SUPPLY.toString()];
    contractBytecode = ZetaEth__factory.bytecode;
  } else {
    constructorTypes = ["address", "address"];
    constructorArgs = [tss, tssUpdater];
    contractBytecode = ZetaNonEth__factory.bytecode;
  }

  const { address } = await deployContractToAddress({
    constructorArgs,
    constructorTypes,
    contractBytecode,
    factoryAddress: immutableCreate2Factory,
    salt: salthex,
    signer,
  });

  saveAddress("zetaToken", address);
  console.log("Deployed zetaToken. Address:", address);
}

if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  deterministicDeployZetaToken()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
