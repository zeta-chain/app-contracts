import { isNetworkName, saveAddress } from "@zetachain/addresses";
import { ethers, network } from "hardhat";

import { getCrossChainWarriors } from "../../lib/cross-chain-warriors/CrossChainWarriors.helpers";

async function main() {
  if (!isNetworkName(network.name)) throw new Error("Invalid network name");

  const crossChainWarriorsContract = await getCrossChainWarriors();

  console.log("Setting base URI");
  (
    await crossChainWarriorsContract.setBaseURI(
      "https://gateway.pinata.cloud/ipfs/QmNRP9kZ2SJXnFnxwvhQbxQHQuXVWVive3JkCNgG6315iH/"
    )
  ).wait();

  const [deployer] = await ethers.getSigners();

  console.log("Minting");
  await crossChainWarriorsContract.mint(deployer.address);

  saveAddress("crossChainNft", crossChainWarriorsContract.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
