import { BigNumber } from "@ethersproject/bignumber";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getAddress as getAddressLib } from "@zetachain/addresses";
import { expect } from "chai";
import { utils } from "ethers";
import { ethers } from "hardhat";

import { encodeParams, getBitcoinTxMemo, getSwapBTCInboundData, getSwapParams } from "../scripts/zeta-swap/helpers";
import { ZetaSwap, ZetaSwap__factory, ZetaSwapBtcInbound, ZetaSwapBtcInbound__factory } from "../typechain-types";
import { ZetaSwapBTC } from "../typechain-types/contracts/zeta-swap/ZetaSwapBTC";
import { ZetaSwapBTC__factory } from "../typechain-types/factories/contracts/zeta-swap/ZetaSwapBTC__factory";

describe("ZetaSwap tests", () => {
  let zetaSwapContract: ZetaSwap;
  let zetaSwapBTCContract: ZetaSwapBTC;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [deployer] = accounts;
    const uniswapRouterAddr = getAddressLib({
      address: "uniswapV2Router02",
      networkName: "eth-mainnet",
      zetaNetwork: "mainnet"
    });
    const wGasToken = getAddressLib({
      address: "weth9",
      networkName: "eth-mainnet",
      zetaNetwork: "mainnet"
    });

    const Factory = (await ethers.getContractFactory("ZetaSwap")) as ZetaSwap__factory;
    zetaSwapContract = (await Factory.deploy(wGasToken, uniswapRouterAddr)) as ZetaSwap;
    await zetaSwapContract.deployed();

    const FactoryBTC = (await ethers.getContractFactory("ZetaSwapBtcInbound")) as ZetaSwapBtcInbound__factory;
    zetaSwapBTCContract = (await FactoryBTC.deploy(wGasToken, uniswapRouterAddr)) as ZetaSwapBtcInbound;
    await zetaSwapBTCContract.deployed();
  });

  describe("zetaSwap", () => {
    it("Should do swap", async () => {
      //@todo: add test

      const fakeZRC20 = accounts[1];
      const fakeZRC20Destination = accounts[2];

      const params = getSwapParams(fakeZRC20Destination.address, deployer.address, BigNumber.from("10"));
      await zetaSwapContract.onCrossChainCall(fakeZRC20.address, 0, params);
    });
  });

  describe("zetaSwapBTC", () => {
    it("Should do swap", async () => {
      //@todo: add test

      const fakeZRC20 = accounts[1];
      const fakeZRC20Destination = accounts[2];

      const params = getBitcoinTxMemo("", fakeZRC20Destination.address, "5");
      await zetaSwapBTCContract.onCrossChainCall(fakeZRC20.address, 0, params);
    });
  });
});
