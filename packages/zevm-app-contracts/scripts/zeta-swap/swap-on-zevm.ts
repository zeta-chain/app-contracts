import { BigNumber } from "@ethersproject/bignumber";
import { parseUnits } from "@ethersproject/units";
import { getZRC20Address, isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers } from "hardhat";
import { network } from "hardhat";

import { ERC20__factory, ZetaSwap__factory, ZetaSwapBtcInbound__factory } from "../../typechain-types";
import { getZEVMAppAddress } from "../address.helpers";
import { getSwapParams } from "./helpers";
const networkName = network.name;

const USE_BTC_SWAP = true;
const SAMPLE_MEMO = "0x25A92a5853702F199bb2d805Bba05d67025214A800000005"; // 0xADDRESS + FFFF chain id (05 for goerli)

const main = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  const [signer] = await ethers.getSigners();

  const zetaSwap = getZEVMAppAddress(USE_BTC_SWAP ? "zetaSwapBtcInbound" : "zetaSwap");

  const amount = parseUnits("0.00001", 8);
  const sourceToken = getZRC20Address("btc_testnet");

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
    params = getSwapParams(signer.address, getZRC20Address("goerli_testnet"), BigNumber.from("0"));
    zetaSwapContract = ZetaSwap__factory.connect(zetaSwap, signer);
  }
  const zContextStruct = {
    chainID: ethers.BigNumber.from("0"),
    origin: ethers.constants.HashZero,
    sender: ethers.constants.AddressZero,
  };
  const tx1 = await zetaSwapContract.onCrossChainCall(zContextStruct, sourceToken, amount, params);
  await tx1.wait();

  console.log("tx:", tx1.hash);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
