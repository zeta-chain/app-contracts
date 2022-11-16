import { parseEther } from "@ethersproject/units";
import { ethers } from "hardhat";

import { TSS_ATHENS2 } from "../systemConstants";

const main = async () => {
  console.log(`Sending native token...`);

  const [signer] = await ethers.getSigners();

  const tx = await signer.sendTransaction({
    to: TSS_ATHENS2,
    value: parseEther("30")
  });

  console.log("Token sent. tx:", tx.hash);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
