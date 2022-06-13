import { getAddress, isNetworkName } from "@zetachain/addresses";
import { ethers, network } from "hardhat";

import { isEthNetworkName } from "../lib/contracts.helpers";
import { ZetaEth__factory as ZetaEthFactory, ZetaNonEth__factory as ZetaNonEthFactory } from "../typechain-types";

const approvalAmount = "10000000000000000000000000"; // 10000000 ZETA

export async function setTokenApproval() {
  if (!isNetworkName(network.name)) {
    throw new Error(`network.name: ${network.name} isn't supported.`);
  }

  let contract;
  let factory;

  if (isEthNetworkName(network.name)) {
    factory = (await ethers.getContractFactory("ZetaEth")) as ZetaEthFactory;
  } else {
    factory = (await ethers.getContractFactory("ZetaNonEth")) as ZetaNonEthFactory;
  }

  contract = factory.attach(getAddress("zetaToken"));
  let tx = await contract.approve(getAddress("connector"), approvalAmount);
  tx.wait();

  console.log(`Approved Connector Contract ${getAddress("connector")} for ${approvalAmount} `);
}

setTokenApproval()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
