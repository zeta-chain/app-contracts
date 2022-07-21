import { getAddress, isNetworkName, saveAddress } from "@zetachain/addresses";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

import { isEthNetworkName } from "../lib/contracts.helpers";
import { deployContractToAddress, saltToHex } from "../lib/ImmutableCreate2Factory/ImmutableCreate2Factory.helpers";
import { ZetaConnectorEth__factory, ZetaConnectorNonEth__factory } from "../typechain-types";

const DEPLOYER_ADDRESS = "0x25A92a5853702F199bb2d805Bba05d67025214A8";
const SALT_NUMBER_ETH = "62735";
const SALT_NUMBER_NON_ETH = "3024";

export async function deterministicDeployZetaConnector() {
  if (!isNetworkName(network.name)) {
    throw new Error(`network.name: ${network.name} isn't supported.`);
  }

  const accounts = await ethers.getSigners();
  const [signer] = accounts;

  const saltNumber = isEthNetworkName(network.name) ? SALT_NUMBER_ETH : SALT_NUMBER_NON_ETH;
  const saltStr = BigNumber.from(saltNumber).toHexString();

  const zetaToken = getAddress("zetaToken");
  const tss = getAddress("tss");
  const tssUpdater = getAddress("tssUpdater");
  const immutableCreate2Factory = getAddress("immutableCreate2Factory");

  const salthex = saltToHex(saltStr, DEPLOYER_ADDRESS);
  const constructorTypes = ["address", "address", "address", "address"];
  const constructorArgs = [zetaToken, tss, tssUpdater, tssUpdater];

  let contractBytecode;
  if (isEthNetworkName(network.name)) {
    contractBytecode = ZetaConnectorEth__factory.bytecode;
  } else {
    contractBytecode = ZetaConnectorNonEth__factory.bytecode;
  }

  const { address } = await deployContractToAddress({
    constructorArgs,
    constructorTypes,
    contractBytecode,
    factoryAddress: immutableCreate2Factory,
    salt: salthex,
    signer,
  });

  saveAddress("connector", address);
  console.log("Deployed ZetaConnector. Address:", address);
}

if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  deterministicDeployZetaConnector()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
