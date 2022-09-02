import { smock } from "@defi-wonderland/smock";
import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IERC20 } from "@zetachain/interfaces/typechain-types";
import chai, { expect } from "chai";
import { formatUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";

import { getZetaMock } from "../lib/shared/deploy.helpers";
import {
  CrossChainLending,
  CrossChainLending__factory,
  CrossChainLendingZetaConnector__factory,
  ERC20,
  FakeERC20__factory,
  MultiChainSwapZetaConnector,
  OracleChainLink,
  OracleChainLink__factory
} from "../typechain-types";
import { getCustomErrorMessage } from "./test.helpers";

chai.should();
chai.use(smock.matchers);

const ETH_USD_DATA_FEED = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

const BTC_USD_DATA_FEED = "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c";
const WBTC_ADDRESS = "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599";

const USDC_USD_DATA_FEED = "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

describe("CrossChainLending tests", () => {
  let zetaTokenMock: IERC20;
  let zetaConnectorMock: MultiChainSwapZetaConnector;

  let oracleChainLink: OracleChainLink;

  let crossChainLendingChainA: CrossChainLending;
  let userConnectionA: CrossChainLending;
  const chainAId = 1;

  let crossChainLendingChainB: CrossChainLending;
  let userConnectionB: CrossChainLending;
  const chainBId = 2;

  let fakeWETH: ERC20;
  let fakeWBTC: ERC20;
  let fakeUSDC: ERC20;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let feeWallet: SignerWithAddress;
  let account1: SignerWithAddress;

  const deployTokensAndOracle = async () => {
    const ERC20Factory = new FakeERC20__factory(deployer);
    fakeWETH = await ERC20Factory.deploy("WETH", "WETH");
    fakeWBTC = await ERC20Factory.deploy("WBTC", "WBTC");
    fakeUSDC = await ERC20Factory.deploy("USDC", "USDC");

    const oracleChainLinkFactory = new OracleChainLink__factory(deployer);
    oracleChainLink = await oracleChainLinkFactory.deploy();
    await oracleChainLink.setAggregator(WETH_ADDRESS, ETH_USD_DATA_FEED);
    await oracleChainLink.setAggregator(WBTC_ADDRESS, BTC_USD_DATA_FEED);
    await oracleChainLink.setAggregator(USDC_ADDRESS, USDC_USD_DATA_FEED);
    await oracleChainLink.setAggregator(fakeWETH.address, ETH_USD_DATA_FEED);
    await oracleChainLink.setAggregator(fakeWBTC.address, BTC_USD_DATA_FEED);
    await oracleChainLink.setAggregator(fakeUSDC.address, USDC_USD_DATA_FEED);
  };

  const deployCrossChainLending = async () => {
    const crossChainLendingFactory = new CrossChainLending__factory(deployer);
    const crossChainLendingContract = await crossChainLendingFactory.deploy(
      zetaConnectorMock.address,
      zetaTokenMock.address
    );
    await crossChainLendingContract.setOracle(oracleChainLink.address);
    await crossChainLendingContract.setAllowedToken(fakeWETH.address, true);
    await crossChainLendingContract.setRiskTable(fakeWETH.address, 2);
    await crossChainLendingContract.setAllowedToken(fakeWBTC.address, true);
    await crossChainLendingContract.setRiskTable(fakeWBTC.address, 2);
    await crossChainLendingContract.setAllowedToken(fakeUSDC.address, true);
    await crossChainLendingContract.setRiskTable(fakeUSDC.address, 2);

    await crossChainLendingContract.setFeeWallet(feeWallet.address);
    return crossChainLendingContract;
  };

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [deployer, account1, feeWallet] = accounts;

    zetaTokenMock = await getZetaMock();
    const zetaConnectorFactory = new CrossChainLendingZetaConnector__factory(deployer);
    zetaConnectorMock = await zetaConnectorFactory.deploy(zetaTokenMock.address);
    await deployTokensAndOracle();

    crossChainLendingChainA = await deployCrossChainLending();
    crossChainLendingChainB = await deployCrossChainLending();

    const encodedCrossChainAddressB = ethers.utils.solidityPack(["address"], [crossChainLendingChainB.address]);
    await crossChainLendingChainA.setInteractorByChainId(chainBId, encodedCrossChainAddressB);

    const encodedCrossChainAddressA = ethers.utils.solidityPack(["address"], [crossChainLendingChainA.address]);
    await crossChainLendingChainB.setInteractorByChainId(chainAId, encodedCrossChainAddressA);

    await fakeWETH.transfer(account1.address, parseUnits("1000"));
    await fakeWBTC.transfer(account1.address, parseUnits("1000"));

    // let's create the initial USDC pool
    await fakeUSDC.approve(crossChainLendingChainA.address, parseUnits("100000"));
    await crossChainLendingChainA.deposit(fakeUSDC.address, parseUnits("100000"));

    await fakeUSDC.approve(crossChainLendingChainB.address, parseUnits("100000"));
    await crossChainLendingChainB.deposit(fakeUSDC.address, parseUnits("100000"));

    // to pay gas...
    zetaTokenMock.transfer(crossChainLendingChainA.address, parseUnits("5000"));
    zetaTokenMock.transfer(crossChainLendingChainB.address, parseUnits("5000"));

    userConnectionA = crossChainLendingChainA.connect(account1);
    userConnectionB = crossChainLendingChainB.connect(account1);
  });

  describe("ChainLinkOracle", () => {
    it("Should estimate right quote", async () => {
      // ETH  2929.75270932;
      // BTC 39699.93878572;
      // USDC 1.0
      let ret = await oracleChainLink.tokenPerUsd(parseUnits("39699.93878572", 8), WBTC_ADDRESS);
      await expect(formatUnits(ret, 8)).to.be.eq("1.0");

      ret = await oracleChainLink.tokenPerUsd(parseUnits("1", 8), USDC_ADDRESS);
      await expect(formatUnits(ret, 6)).to.be.eq("1.0");

      ret = await oracleChainLink.tokenPerUsd(parseUnits("2929.75270932", 8), WETH_ADDRESS);
      await expect(formatUnits(ret, 18)).to.be.eq("1.0");

      ret = await oracleChainLink.tokenPerUsd(parseUnits("2929.75270932", 8).div(2), WETH_ADDRESS);
      await expect(formatUnits(ret, 18)).to.be.eq("0.5");

      ret = await oracleChainLink.usdPerToken(parseUnits("1", 8), WBTC_ADDRESS);
      await expect(formatUnits(ret, 8)).to.be.eq("39699.93878572");

      ret = await oracleChainLink.usdPerToken(parseUnits("1", 18), WETH_ADDRESS);
      await expect(formatUnits(ret, 8)).to.be.eq("2929.75270932");

      ret = await oracleChainLink.usdPerToken(parseUnits("1", 6), USDC_ADDRESS);
      await expect(formatUnits(ret, 8)).to.be.eq("1.0");
    });
  });

  describe("CrossChainLendingPool", () => {
    it("Should deposit and borrow", async () => {
      // ETH  2929.75270932;
      // BTC 39699.93878572;
      // USDC 1.0
      await fakeWETH.connect(account1).approve(crossChainLendingChainA.address, parseUnits("1"));
      await userConnectionA.deposit(fakeWETH.address, parseUnits("1"));

      const initialUSDCBalance = await fakeUSDC.balanceOf(account1.address);
      const status1 = await userConnectionA.getUserBalances(account1.address, fakeWETH.address);
      await expect(status1[0]).to.be.eq(parseUnits("1"));
      await expect(status1[1]).to.be.eq(parseUnits("0"));

      await userConnectionB.borrow(fakeUSDC.address, parseUnits("1000"), fakeWETH.address, chainAId, 0, 0);
      const finalUSDCBalance = await fakeUSDC.balanceOf(account1.address);
      await expect(finalUSDCBalance.sub(initialUSDCBalance)).to.be.eq(parseUnits("1000"));

      const status2 = await userConnectionA.getUserBalances(account1.address, fakeWETH.address);
      await expect(status2[0]).to.be.eq(parseUnits("0.317348527868004600"));
      await expect(status2[1]).to.be.eq(parseUnits("0.682651472131995400"));
    });

    it("Should fail if not enoght collateral", async () => {
      // ETH  2929.75270932;
      // BTC 39699.93878572;
      // USDC 1.0
      await fakeWETH.connect(account1).approve(crossChainLendingChainA.address, parseUnits("1"));
      await userConnectionA.deposit(fakeWETH.address, parseUnits("1"));

      const call = userConnectionB.borrow(fakeUSDC.address, parseUnits("1500"), fakeWETH.address, chainAId, 0, 0);
      await expect(call).to.be.revertedWith(getCustomErrorMessage("NotEnoughCollateral"));
    });

    it("Should repay and unlock", async () => {
      // ETH  2929.75270932;
      // BTC 39699.93878572;
      // USDC 1.0
      await fakeWETH.connect(account1).approve(crossChainLendingChainA.address, parseUnits("1"));
      await userConnectionA.deposit(fakeWETH.address, parseUnits("1"));

      const initialUSDCBalance = await fakeUSDC.balanceOf(account1.address);
      let status = await userConnectionA.getUserBalances(account1.address, fakeWETH.address);
      await expect(status[0]).to.be.eq(parseUnits("1"));
      await expect(status[1]).to.be.eq(parseUnits("0"));
      await expect(status[0].add(status[1])).to.be.eq(parseUnits("1"));

      await userConnectionB.borrow(fakeUSDC.address, parseUnits("1000"), fakeWETH.address, chainAId, 0, 0);
      status = await userConnectionA.getUserBalances(account1.address, fakeWETH.address);
      await expect(status[0]).to.be.eq(parseUnits("0.317348527868004600"));
      await expect(status[1]).to.be.eq(parseUnits("0.682651472131995400"));
      await expect(status[0].add(status[1])).to.be.eq(parseUnits("1"));

      await fakeUSDC.connect(account1).approve(crossChainLendingChainB.address, parseUnits("500"));
      await userConnectionB.repay(fakeUSDC.address, parseUnits("500"), fakeWETH.address, chainAId, 0, 0);
      const finalUSDCBalance = await fakeUSDC.balanceOf(account1.address);
      await expect(finalUSDCBalance.sub(initialUSDCBalance)).to.be.eq(parseUnits("500"));

      status = await userConnectionA.getUserBalances(account1.address, fakeWETH.address);
      await expect(status[0]).to.be.eq(parseUnits("0.655261006573342323"));
      await expect(status[1]).to.be.eq(parseUnits("0.341325736065997700"));
      await expect(status[0].add(status[1])).to.be.eq(parseUnits("0.996586742639340023"));

      const feeWalletWETHBalance = await fakeWETH.balanceOf(feeWallet.address);
      await expect(feeWalletWETHBalance).to.be.eq(parseUnits("0.003413257360659977"));
      await expect(feeWalletWETHBalance.add(status[0]).add(status[1])).to.be.eq(parseUnits("1"));
    });

    it("Should repay the full debt and unlock everything", async () => {
      // ETH  2929.75270932;
      // BTC 39699.93878572;
      // USDC 1.0
      await fakeWETH.connect(account1).approve(crossChainLendingChainA.address, parseUnits("1"));
      await userConnectionA.deposit(fakeWETH.address, parseUnits("1"));

      const initialUSDCBalance = await fakeUSDC.balanceOf(account1.address);
      let status = await userConnectionA.getUserBalances(account1.address, fakeWETH.address);
      await expect(status[0]).to.be.eq(parseUnits("1"));
      await expect(status[1]).to.be.eq(parseUnits("0"));
      await expect(status[0].add(status[1])).to.be.eq(parseUnits("1"));

      await userConnectionB.borrow(fakeUSDC.address, parseUnits("1000"), fakeWETH.address, chainAId, 0, 0);
      status = await userConnectionA.getUserBalances(account1.address, fakeWETH.address);
      await expect(status[0]).to.be.eq(parseUnits("0.317348527868004600"));
      await expect(status[1]).to.be.eq(parseUnits("0.682651472131995400"));
      await expect(status[0].add(status[1])).to.be.eq(parseUnits("1"));

      await fakeUSDC.connect(account1).approve(crossChainLendingChainB.address, parseUnits("1000"));
      await userConnectionB.repay(fakeUSDC.address, parseUnits("1000"), fakeWETH.address, chainAId, 0, 0);

      const finalUSDCBalance = await fakeUSDC.balanceOf(account1.address);
      await expect(finalUSDCBalance.sub(initialUSDCBalance)).to.be.eq(parseUnits("0"));

      status = await userConnectionA.getUserBalances(account1.address, fakeWETH.address);
      await expect(status[0]).to.be.eq(parseUnits("0.993173485278680046"));
      await expect(status[1]).to.be.eq(parseUnits("0"));
      await expect(status[0].add(status[1])).to.be.eq(parseUnits("0.993173485278680046"));
      const feeWalletWETHBalance = await fakeWETH.balanceOf(feeWallet.address);
      await expect(feeWalletWETHBalance).to.be.eq(parseUnits("0.006826514721319954"));

      await expect(feeWalletWETHBalance.add(status[0]).add(status[1])).to.be.eq(parseUnits("1"));
    });
  });
});
