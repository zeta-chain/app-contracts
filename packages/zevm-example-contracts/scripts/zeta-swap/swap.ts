import { BigNumber } from "@ethersproject/bignumber";
import { parseEther } from "@ethersproject/units";
import { getAddress, isNetworkName } from "@zetachain/addresses";
import { getZRC20Address } from "@zetachain/addresses-tools";
import { ethers } from "hardhat";
import { network } from "hardhat";

import { getSwapData } from "./helpers";

const main = async () => {
  if (!isNetworkName(network.name) || !network.name) throw new Error("Invalid network name");
  const ZRC20Addresses = getZRC20Address();

  const destinationToken = network.name == "goerli" ? ZRC20Addresses["tMATIC"] : ZRC20Addresses["gETH"];

  console.log(`Swapping native token...`);

  const [signer] = await ethers.getSigners();

  const zetaSwapAddress = getAddress({
    address: "zetaSwap",
    networkName: "athens",
    zetaNetwork: "athens"
  });

  const tssAddress = getAddress({
    address: "tss",
    networkName: network.name,
    zetaNetwork: "athens"
  });

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
