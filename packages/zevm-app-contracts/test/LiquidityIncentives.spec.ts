import { BigNumber } from "@ethersproject/bignumber";
import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getAddress as getAddressLib } from "@zetachain/addresses";
import { expect } from "chai";
import { ethers, network } from "hardhat";

import { getBitcoinTxMemoForTest, getSwapParams } from "../scripts/zeta-swap/helpers";
import {
  TestSystemContract,
  TestZRC20,
  ZetaSwap,
  ZetaSwap__factory,
  ZetaSwapBtcInbound,
  ZetaSwapBtcInbound__factory,
  ZetaSwapBtcInboundV2,
  ZetaSwapBtcInboundV2__factory,
  ZetaSwapV2,
  ZetaSwapV2__factory
} from "../typechain-types";
import { evmSetup } from "./test.helpers";

describe("LiquidityIncentives tests", () => {
  let zetaSwapContract: ZetaSwap;
  let zetaSwapV2Contract: ZetaSwapV2;
  let zetaSwapBTCContract: ZetaSwapBtcInbound;
  let zetaSwapBTCV2Contract: ZetaSwapBtcInboundV2;
  let ZRC20Contracts: TestZRC20[];
  let systemContract: TestSystemContract;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [deployer] = accounts;

    await network.provider.send("hardhat_setBalance", [deployer.address, parseUnits("1000000").toHexString()]);

    const uniswapRouterAddr = getAddressLib({
      address: "uniswapV2Router02",
      networkName: "eth-mainnet",
      zetaNetwork: "mainnet"
    });

    const uniswapFactoryAddr = getAddressLib({
      address: "uniswapV2Factory",
      networkName: "eth-mainnet",
      zetaNetwork: "mainnet"
    });

    const wGasToken = getAddressLib({
      address: "weth9",
      networkName: "eth-mainnet",
      zetaNetwork: "mainnet"
    });

    const evmSetupResult = await evmSetup(wGasToken, uniswapFactoryAddr, uniswapRouterAddr);
    ZRC20Contracts = evmSetupResult.ZRC20Contracts;
    systemContract = evmSetupResult.systemContract;

    const FactorySwap = (await ethers.getContractFactory("ZetaSwap")) as ZetaSwap__factory;
    zetaSwapContract = (await FactorySwap.deploy(wGasToken, uniswapFactoryAddr, uniswapRouterAddr)) as ZetaSwap;
    await zetaSwapContract.deployed();

    const FactorySwapV2 = (await ethers.getContractFactory("ZetaSwapV2")) as ZetaSwapV2__factory;
    zetaSwapV2Contract = (await FactorySwapV2.deploy(systemContract.address)) as ZetaSwapV2;
    await zetaSwapV2Contract.deployed();

    const FactoryBTC = (await ethers.getContractFactory("ZetaSwapBtcInbound")) as ZetaSwapBtcInbound__factory;
    zetaSwapBTCContract = (await FactoryBTC.deploy(
      wGasToken,
      uniswapFactoryAddr,
      uniswapRouterAddr,
      systemContract.address
    )) as ZetaSwapBtcInbound;
    await zetaSwapBTCContract.deployed();

    const FactoryBTCV2 = (await ethers.getContractFactory("ZetaSwapBtcInboundV2")) as ZetaSwapBtcInboundV2__factory;
    zetaSwapBTCV2Contract = (await FactoryBTCV2.deploy(systemContract.address)) as ZetaSwapBtcInboundV2;
    await zetaSwapBTCV2Contract.deployed();
  });

  describe("zetaSwap", () => {
    it("Should do swap", async () => {
      const amount = parseUnits("10");
      await ZRC20Contracts[0].transfer(zetaSwapContract.address, amount);

      const initBalance = await ZRC20Contracts[1].balanceOf(deployer.address);

      const params = getSwapParams(deployer.address, ZRC20Contracts[1].address, BigNumber.from(0));
      await zetaSwapContract.onCrossChainCall(ZRC20Contracts[0].address, amount, params);

      const endBalance = await ZRC20Contracts[1].balanceOf(deployer.address);
      await expect(endBalance).to.be.gt(initBalance);
    });
  });

  describe("zetaSwapV2", () => {
    it("Should do swap", async () => {
      const amount = parseUnits("10");
      await ZRC20Contracts[0].transfer(zetaSwapV2Contract.address, amount);

      const initBalance = await ZRC20Contracts[1].balanceOf(deployer.address);

      const params = getSwapParams(deployer.address, ZRC20Contracts[1].address, BigNumber.from(0));
      await zetaSwapV2Contract.onCrossChainCall(ZRC20Contracts[0].address, amount, params);

      const endBalance = await ZRC20Contracts[1].balanceOf(deployer.address);
      expect(endBalance).to.be.gt(initBalance);
    });
  });

  describe("zetaSwapBTC", () => {
    it("Should do swap", async () => {
      const amount = parseUnits("1");
      await ZRC20Contracts[0].transfer(zetaSwapBTCContract.address, amount);

      const initBalance = await ZRC20Contracts[1].balanceOf(deployer.address);

      const params = getBitcoinTxMemoForTest(deployer.address, "5");
      await zetaSwapBTCContract.onCrossChainCall(ZRC20Contracts[0].address, amount, params);

      const endBalance = await ZRC20Contracts[1].balanceOf(deployer.address);
      expect(endBalance).to.be.gt(initBalance);
    });
  });

  describe("zetaSwapBTCV2", () => {
    it("Should do swap", async () => {
      const amount = parseUnits("1");
      await ZRC20Contracts[0].transfer(zetaSwapBTCV2Contract.address, amount);

      const initBalance = await ZRC20Contracts[1].balanceOf(deployer.address);

      const params = getBitcoinTxMemoForTest(deployer.address, "5");
      await zetaSwapBTCV2Contract.onCrossChainCall(ZRC20Contracts[0].address, amount, params);

      const endBalance = await ZRC20Contracts[1].balanceOf(deployer.address);
      expect(endBalance).to.be.gt(initBalance);
    });
  });
});
