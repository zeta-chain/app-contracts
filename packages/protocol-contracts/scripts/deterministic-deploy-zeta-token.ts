import { getAddress, isNetworkName, saveAddress } from "@zetachain/addresses";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

import { ZETA_INITIAL_SUPPLY } from "../lib/contracts.constants";
import { isEthNetworkName } from "../lib/contracts.helpers";
import { deployContractToAddress, saltToHex } from "../lib/ImmutableCreate2Factory/ImmutableCreate2Factory.helpers";
import { ZetaEth__factory, ZetaNonEth__factory } from "../typechain-types";

const DEPLOYER_ADDRESS = "0x25A92a5853702F199bb2d805Bba05d67025214A8";
const SALT_NUMBER_ETH = "38208";
const SALT_NUMBER_NON_ETH = "29411";

export async function deterministicDeployZetaToken() {
  if (!isNetworkName(network.name)) {
    throw new Error(`network.name: ${network.name} isn't supported.`);
  }

  const accounts = await ethers.getSigners();
  const [signer] = accounts;

  const saltNumber = isEthNetworkName(network.name) ? SALT_NUMBER_ETH : SALT_NUMBER_NON_ETH;
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
