import { BigNumber } from "@ethersproject/bignumber";
import { parseEther } from "@ethersproject/units";
import { getAddress, getZRC20Address, isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network } from "hardhat";

import { getZEVMAppAddress } from "../address.helpers";
import { getSwapData } from "./helpers";

const main = async () => {
  if (!isProtocolNetworkName(network.name)) throw new Error("Invalid network name");

  const destinationToken =
    network.name == "goerli_testnet" ? getZRC20Address("mumbai_testnet") : getZRC20Address("goerli_testnet");

  console.log(`Swapping native token...`);

  const [signer] = await ethers.getSigners();

  const zetaSwapAddress = getZEVMAppAddress("zetaSwap");

  const tssAddress = getAddress("tss", network.name);

  const data = getSwapData(zetaSwapAddress, signer.address, destinationToken, BigNumber.from("0"));

  const tx = await signer.sendTransaction({
    data,
    to: tssAddress,
    value: parseEther("0.005")
  });

  console.log("tx:", tx.hash);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
