import { BigNumber } from "@ethersproject/bignumber";
import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getNonZetaAddress } from "@zetachain/protocol-contracts";
import { expect } from "chai";
import { ethers, network } from "hardhat";

import {
  MockSystemContract,
  MockZRC20,
  ZetaSwap,
  ZetaSwap__factory,
  ZetaSwapBtcInbound,
  ZetaSwapBtcInbound__factory
} from "../../zevm-example-contracts/typechain-types";
import { getBitcoinTxMemoForTest, getSwapParams } from "../scripts/zeta-swap/helpers";
import { evmSetup } from "./test.helpers";

describe("ZetaSwap tests", () => {
  let zetaSwapContract: ZetaSwap;
  let zetaSwapBTCContract: ZetaSwapBtcInbound;
  let ZRC20Contracts: MockZRC20[];
  let systemContract: MockSystemContract;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [deployer] = accounts;

    await network.provider.send("hardhat_setBalance", [deployer.address, parseUnits("1000000").toHexString()]);

    const uniswapRouterAddr = getNonZetaAddress("uniswapV2Router02", "eth_mainnet");

    const uniswapFactoryAddr = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // getNonZetaAddress("uniswapV2Factory02", "etherum_mainnet");

    const wGasToken = getNonZetaAddress("weth9", "eth_mainnet");

    const evmSetupResult = await evmSetup(wGasToken, uniswapFactoryAddr, uniswapRouterAddr);
    ZRC20Contracts = evmSetupResult.ZRC20Contracts;
    systemContract = evmSetupResult.systemContract;

    const FactorySwap = (await ethers.getContractFactory("ZetaSwap")) as ZetaSwap__factory;
    zetaSwapContract = (await FactorySwap.deploy(systemContract.address)) as ZetaSwap;
    await zetaSwapContract.deployed();

    const FactoryBTC = (await ethers.getContractFactory("ZetaSwapBtcInbound")) as ZetaSwapBtcInbound__factory;
    zetaSwapBTCContract = (await FactoryBTC.deploy(systemContract.address)) as ZetaSwapBtcInbound;
    await zetaSwapBTCContract.deployed();
  });

  describe("zetaSwap", () => {
    it("Should do swap", async () => {
      const amount = parseUnits("10");
      await ZRC20Contracts[0].transfer(systemContract.address, amount);

      const initBalance = await ZRC20Contracts[1].balanceOf(deployer.address);

      const params = getSwapParams(deployer.address, ZRC20Contracts[1].address, BigNumber.from(0));
      await systemContract.onCrossChainCall(zetaSwapContract.address, ZRC20Contracts[0].address, amount, params);

      const endBalance = await ZRC20Contracts[1].balanceOf(deployer.address);
      expect(endBalance).to.be.gt(initBalance);
    });
  });

  describe("zetaSwapBTC", () => {
    it("Should do swap", async () => {
      const amount = parseUnits("1");
      await ZRC20Contracts[0].transfer(systemContract.address, amount);

      const initBalance = await ZRC20Contracts[1].balanceOf(deployer.address);

      const params = getBitcoinTxMemoForTest(deployer.address, "5");
      await systemContract.onCrossChainCall(zetaSwapBTCContract.address, ZRC20Contracts[0].address, amount, params);

      const endBalance = await ZRC20Contracts[1].balanceOf(deployer.address);
      expect(endBalance).to.be.gt(initBalance);
    });
  });
});
