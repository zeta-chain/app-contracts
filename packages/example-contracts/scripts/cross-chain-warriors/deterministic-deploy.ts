import { getAddress, isNetworkName, saveAddress } from "@zetachain/addresses";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

import { deployContractToAddress, saltToHex } from "../../lib/shared/ImmutableCreate2Factory.helpers";
import { isEthNetworkName } from "../../lib/shared/network.constants";
import { CrossChainWarriors__factory } from "../../typechain-types";

const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS ?? "";
const SALT_NUMBER = "0";

export async function deterministicDeployCrossChainNft() {
  if (!isNetworkName(network.name)) {
    throw new Error(`network.name: ${network.name} isn't supported.`);
  }

  const accounts = await ethers.getSigners();
  const [signer] = accounts;

  const saltNumber = SALT_NUMBER;
  const saltStr = BigNumber.from(saltNumber).toHexString();

  const connector = getAddress("connector");
  const zetaToken = getAddress("zetaToken");
  const zetaTokenConsumerUniV2 = getAddress("zetaTokenConsumerUniV2");

  const immutableCreate2Factory = getAddress("immutableCreate2Factory");

  const salthex = saltToHex(saltStr, DEPLOYER_ADDRESS);

  const useEven = isEthNetworkName(network.name);
  const constructorTypes = ["address", "address", "address", "bool"];
  const constructorArgs = [connector, zetaToken, zetaTokenConsumerUniV2, useEven];

  const contractBytecode = CrossChainWarriors__factory.bytecode;

  const { address } = await deployContractToAddress({
    constructorArgs,
    constructorTypes,
    contractBytecode,
    factoryAddress: immutableCreate2Factory,
    salt: salthex,
    signer,
  });

  saveAddress("crossChainNft", address);
  console.log("Deployed crossChainNft. Address:", address);
}

if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  deterministicDeployCrossChainNft()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
