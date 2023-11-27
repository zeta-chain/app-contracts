import { parseEther } from "@ethersproject/units";
import { getAddress, isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers } from "hardhat";
import { network } from "hardhat";

const main = async () => {
  if (!isProtocolNetworkName(network.name)) throw new Error("Invalid network name");
  console.log(`Sending native token...`);

  const [signer] = await ethers.getSigners();

  const tssAddress = getAddress("tss", network.name);

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
