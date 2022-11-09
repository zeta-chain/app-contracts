import { BigNumber } from "@ethersproject/bignumber";
import { parseEther } from "@ethersproject/units";
import { getAddress as getAddressLib } from "@zetachain/addresses";
import { ethers } from "hardhat";

import { tMATIC, TSS_ATHENS2 } from "../systemConstants";
import { getSwapData } from "./helpers";

const main = async () => {
  console.log(`Swapping native token...`);

  const [signer] = await ethers.getSigners();

  const zetaSwap = getAddressLib({
    address: "zetaSwap",
    networkName: "athens-v2",
    zetaNetwork: "athens"
  });

  const data = getSwapData(zetaSwap, signer.address, tMATIC, BigNumber.from("0"));

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
