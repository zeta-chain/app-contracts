import { BigNumber } from "@ethersproject/bignumber";
import { parseEther } from "@ethersproject/units";
import { getAddress, isNetworkName} from "@zetachain/addresses";
import { ethers } from "hardhat";

import { ZRC20Addresses, TSS_ATHENS2 } from "../systemConstants";
import { getSwapData } from "./helpers";
import { network } from "hardhat";

const main = async () => {
  if (!isNetworkName(network.name) || !network.name) throw new Error("Invalid network name");

  const destinationToken = network.name == 'goerli' ? ZRC20Addresses['tMATIC'] : ZRC20Addresses['gETH']

  console.log(`Swapping native token...`);

  const [signer] = await ethers.getSigners();

  const zetaSwap = getAddress({
    address: "zetaSwap",
    networkName: "athens",
    zetaNetwork: "athens"
  });

  const data = getSwapData(zetaSwap, signer.address, destinationToken, BigNumber.from("0"));

  const tx = await signer.sendTransaction({
    data,
    to: TSS_ATHENS2,
    value: parseEther("0.5")
  });

  console.log("tx:", tx.hash);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
