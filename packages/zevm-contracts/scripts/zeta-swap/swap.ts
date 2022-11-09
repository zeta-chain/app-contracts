import { BigNumber } from "@ethersproject/bignumber";
import { parseEther } from "@ethersproject/units";
import { getAddress } from "@zetachain/addresses";
import { ethers } from "hardhat";

import { ZRC20Addresses, TSS_ATHENS2 } from "../systemConstants";
import { getSwapData } from "./helpers";

const main = async () => {
  console.log(`Swapping native token...`);

  const [signer] = await ethers.getSigners();

  const zetaSwap = getAddress({
    address: "zetaSwap",
    networkName: "athens-v2",
    zetaNetwork: "athens"
  });

  const data = getSwapData(zetaSwap, signer.address, ZRC20Addresses['tMATIC'], BigNumber.from("0"));

  const tx = await signer.sendTransaction({
    data,
    to: TSS_ATHENS2,
    value: parseEther("0.1")
  });

  console.log("tx:", tx.hash);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
