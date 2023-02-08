import { getChainId } from "@zetachain/addresses";
import { ZetaConnectorEth__factory as ZetaConnectorEthFactory } from "@zetachain/interfaces/typechain-types";
import { AbiCoder } from "ethers/lib/utils";
import { ethers } from "hardhat";

import { getAddress } from "../lib/address.helpers";

const encoder = new AbiCoder();

async function main() {
  const factory = (await ethers.getContractFactory("ZetaConnectorEth")) as ZetaConnectorEthFactory;
  const accounts = await ethers.getSigners();
  const contract = factory.attach(getAddress("connector"));

  console.log(`Sending To ${accounts[0].address}`);
  await (
    await contract.send({
      destinationAddress: encoder.encode(["address"], [accounts[0].address]),
      destinationChainId: getChainId("bsc-testnet"),
      destinationGasLimit: 1_000_000,
      message: encoder.encode(["address"], [accounts[0].address]),
      zetaParams: [],
      zetaValueAndGas: "10000000000000000000"
    })
  ).wait();
  console.log("Sent");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
