import { parseEther } from "@ethersproject/units";
import { parseUnits } from "@ethersproject/units";
import { getAddress as getAddressLib } from "@zetachain/addresses";
import { ethers } from "hardhat";

import { ZetaSwap, ZetaSwap__factory } from "../../typechain-types";
import { gETH, tMATIC } from "../systemConstants";

export const encodeParams = (dataTypes: any[], data: any[]) => {
  const abiCoder = ethers.utils.defaultAbiCoder;
  return abiCoder.encode(dataTypes, data);
};

const main = async () => {
  console.log(`Swapping native token...`);

  const [signer] = await ethers.getSigners();

  const paddedDestination = ethers.utils.hexlify(ethers.utils.zeroPad(signer.address, 32));
  const params = encodeParams(["address", "bytes32", "uint256"], [tMATIC, paddedDestination, 0]);

  const zetaSwap = getAddressLib({
    address: "zetaSwap",
    networkName: "athens-v2",
    zetaNetwork: "athens"
  });

  const zetaSwapContract = ZetaSwap__factory.connect(zetaSwap, signer);
  const tx = await zetaSwapContract.onCrossChainCall(gETH, parseUnits("0.001"), params);

  console.log("tx:", tx.hash);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
