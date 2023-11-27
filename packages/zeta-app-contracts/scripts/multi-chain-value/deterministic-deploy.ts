import { getAddress, isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

import { deployContractToAddress, saltToHex } from "../../lib/shared/ImmutableCreate2Factory.helpers";
import { MultiChainValue__factory } from "../../typechain-types";
import { saveAddress } from "../address.helpers";

const DEPLOYER_ADDRESS = process.env.DEPLOYER_ADDRESS ?? "";
const SALT_NUMBER = "0";

const networkName = network.name;

export async function deterministicDeployMultiChainValue() {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const accounts = await ethers.getSigners();
  const [signer] = accounts;

  const saltNumber = SALT_NUMBER;
  const saltStr = BigNumber.from(saltNumber).toHexString();

  const connector = getAddress("connector", networkName);
  const zetaToken = getAddress("zetaToken", networkName);

  const immutableCreate2Factory = getAddress("immutableCreate2Factory", networkName);

  const salthex = saltToHex(saltStr, DEPLOYER_ADDRESS);

  const constructorTypes = ["address", "address"];
  const constructorArgs = [connector, zetaToken];

  const contractBytecode = MultiChainValue__factory.bytecode;

  const { address } = await deployContractToAddress({
    constructorArgs,
    constructorTypes,
    contractBytecode,
    factoryAddress: immutableCreate2Factory,
    salt: salthex,
    signer
  });

  saveAddress("multiChainValue", address);
  console.log("Deployed multiChainValue. Address:", address);
}

if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  deterministicDeployMultiChainValue()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
