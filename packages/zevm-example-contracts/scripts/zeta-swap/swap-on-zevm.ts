import { BigNumber } from "@ethersproject/bignumber";
import { parseUnits } from "@ethersproject/units";
import { getAddress, isZetaNetworkName } from "@zetachain/addresses";
import { ethers } from "hardhat";
import { network } from "hardhat";

import { ERC20__factory, ZetaSwap__factory, ZetaSwapBtcInbound__factory } from "../../typechain-types";
import { ZRC20Addresses } from "../systemConstants";
import { getSwapParams } from "./helpers";

const USE_BTC_SWAP = true;
const SAMPLE_MEMO = "0x25A92a5853702F199bb2d805Bba05d67025214A800000005"; // 0xADDRESS + FFFF chain id (05 for goerli)

const main = async () => {
  if (!isZetaNetworkName(network.name) || !network.name) throw new Error("Invalid network name");
  const [signer] = await ethers.getSigners();
  const zetaSwap = getAddress({
    address: USE_BTC_SWAP ? "zetaSwapBtcInbound" : "zetaSwap",
    networkName: "athens",
    zetaNetwork: "athens"
  });

  const amount = parseUnits("0.00001", 8);
  const sourceToken = ZRC20Addresses["tBTC"];

  const zrc20Contract = ERC20__factory.connect(sourceToken, signer);
  const tx0 = await zrc20Contract.transfer(zetaSwap, amount);
  await tx0.wait();

  console.log(`Swapping native token from zEVM...`);

  let params;
  let zetaSwapContract;

  if (USE_BTC_SWAP) {
    params = ethers.utils.arrayify(SAMPLE_MEMO);
    zetaSwapContract = ZetaSwapBtcInbound__factory.connect(zetaSwap, signer);
  } else {
    params = getSwapParams(signer.address, ZRC20Addresses["gETH"], BigNumber.from("0"));
    zetaSwapContract = ZetaSwap__factory.connect(zetaSwap, signer);
  }
  const tx1 = await zetaSwapContract.onCrossChainCall(sourceToken, amount, params);
  await tx1.wait();

  console.log("tx:", tx1.hash);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
