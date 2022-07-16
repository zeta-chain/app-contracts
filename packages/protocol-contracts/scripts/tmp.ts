import { getAddress, getChainId } from "@zetachain/addresses";
import { AbiCoder } from "ethers/lib/utils";
import { ethers } from "hardhat";

import { ZetaConnectorEth__factory as ZetaConnectorEthFactory } from "../typechain-types";

const encoder = new AbiCoder();

async function main() {
  const factory = (await ethers.getContractFactory("ZetaConnectorEth")) as ZetaConnectorEthFactory;

  const contract = factory.attach(getAddress("connector"));

  console.log("connector TSS address");
  const tssAddress = await contract.tssAddress()
  console.log(tssAddress)
  console.log("connector TSSUpdater address", await contract.tssAddressUpdater())
  console.log("my signer address:", await contract.signer.getAddress())
  console.log("updating TSS address to ", getAddress("tss"))
  ;(await contract.updateTssAddress(getAddress("tss"))).wait()
  console.log("new connector TSS address", await contract.tssAddress())
  console.log("token address", await contract.zetaToken())
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
