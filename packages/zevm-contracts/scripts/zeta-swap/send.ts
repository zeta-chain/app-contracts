import { parseEther } from "@ethersproject/units";
import { getAddress } from "@zetachain/addresses";
import { ethers } from "hardhat";
import { network } from "hardhat";

const main = async () => {
  console.log(`Sending native token...`);

  const [signer] = await ethers.getSigners();

  const tssAddress = getAddress({
    address: "tss",
    networkName: network.name,
    zetaNetwork: "athens"
  });

  const tx = await signer.sendTransaction({
    to: tssAddress,
    value: parseEther("30")
  });

  console.log("Token sent. tx:", tx.hash);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
