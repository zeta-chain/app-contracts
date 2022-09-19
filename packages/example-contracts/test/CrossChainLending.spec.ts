import { smock } from "@defi-wonderland/smock";
import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IERC20 } from "@zetachain/interfaces/typechain-types";
import chai, { expect } from "chai";
import { BigNumber } from "ethers";
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
  OracleChainLink__factory,
  StableCoinAggregator__factory
} from "../typechain-types";
import { getCustomErrorMessage } from "./test.helpers";

chai.should();
chai.use(smock.matchers);

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

  let fakeWBTC: ERC20;
  let fakeUSDC: ERC20;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let feeWallet: SignerWithAddress;
  let account1: SignerWithAddress;
  let account2: SignerWithAddress;

  const deployTokensAndOracle = async () => {
    const ERC20Factory = new FakeERC20__factory(deployer);
    fakeWBTC = await ERC20Factory.deploy("WBTC", "WBTC");
    fakeUSDC = await ERC20Factory.deploy("USDC", "USDC");

    const stableCoinAggregatorFactory = new StableCoinAggregator__factory(deployer);
    const BTCAggregator = await stableCoinAggregatorFactory.deploy(
      8,
      BigNumber.from(20000).mul(BigNumber.from(10).pow(8))
    );
    const USDAggregator = await stableCoinAggregatorFactory.deploy(8, BigNumber.from(1).mul(BigNumber.from(10).pow(8)));

    const oracleChainLinkFactory = new OracleChainLink__factory(deployer);
    oracleChainLink = await oracleChainLinkFactory.deploy();
    await oracleChainLink.setAggregator(fakeWBTC.address, BTCAggregator.address);
    await oracleChainLink.setAggregator(fakeUSDC.address, USDAggregator.address);
  };

  const deployCrossChainLending = async () => {
    const crossChainLendingFactory = new CrossChainLending__factory(deployer);
    const crossChainLendingContract = await crossChainLendingFactory.deploy(
      zetaConnectorMock.address,
      zetaTokenMock.address
    );
    await crossChainLendingContract.setOracle(oracleChainLink.address);
    await crossChainLendingContract.setAllowedToken(fakeWBTC.address, true);
    await crossChainLendingContract.setRiskTable(fakeWBTC.address, 2000);
    await crossChainLendingContract.setAllowedToken(fakeUSDC.address, true);
    await crossChainLendingContract.setRiskTable(fakeUSDC.address, 2000);

    await crossChainLendingContract.setFeeWallet(feeWallet.address);
    return crossChainLendingContract;
  };

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [deployer, account1, account2, feeWallet] = accounts;

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

  const getBalanceDeposit = (b: BigNumber[]) => b[0];
  const getBalanceLocked = (b: BigNumber[]) => b[1];
  const reverseFee = (b: BigNumber) => b.mul(100).div(99);

  describe("CrossChainLendingPool", () => {
    it("Should deposit and borrow", async () => {
      // BTC 20000;
      // USDC 1
      await fakeWBTC.connect(account1).approve(crossChainLendingChainA.address, parseUnits("1"));
      await userConnectionA.deposit(fakeWBTC.address, parseUnits("1"));

      const initialUSDCBalance = await fakeUSDC.balanceOf(account1.address);
      const balances1 = await userConnectionA.getUserBalances(account1.address, fakeWBTC.address);
      await expect(getBalanceDeposit(balances1)).to.be.eq(parseUnits("1"));
      await expect(getBalanceLocked(balances1)).to.be.eq(parseUnits("0"));

      await userConnectionB.borrow(fakeUSDC.address, parseUnits("1000"), fakeWBTC.address, chainAId, 0, 0);
      const finalUSDCBalance = await fakeUSDC.balanceOf(account1.address);
      await expect(finalUSDCBalance.sub(initialUSDCBalance)).to.be.eq(parseUnits("1000"));

      const balances2 = await userConnectionA.getUserBalances(account1.address, fakeWBTC.address);

      await expect(getBalanceDeposit(balances2)).to.be.eq(parseUnits("0.9"));
      await expect(getBalanceLocked(balances2)).to.be.eq(parseUnits("0.1"));
    });

    it("Should fail if not enoght collateral", async () => {
      await fakeWBTC.connect(account1).approve(crossChainLendingChainA.address, parseUnits("1"));
      await userConnectionA.deposit(fakeWBTC.address, parseUnits("1"));

      const call = userConnectionB.borrow(fakeUSDC.address, parseUnits("11000"), fakeWBTC.address, chainAId, 0, 0);
      await expect(call).to.be.revertedWith(getCustomErrorMessage("NotEnoughCollateral"));
    });

    it("Should repay and unlock", async () => {
      await fakeWBTC.connect(account1).approve(crossChainLendingChainA.address, parseUnits("1"));
      await userConnectionA.deposit(fakeWBTC.address, parseUnits("1"));

      const initialUSDCBalance = await fakeUSDC.balanceOf(account1.address);
      let balances = await userConnectionA.getUserBalances(account1.address, fakeWBTC.address);
      await expect(getBalanceDeposit(balances)).to.be.eq(parseUnits("1"));
      await expect(getBalanceLocked(balances)).to.be.eq(parseUnits("0"));

      await userConnectionB.borrow(fakeUSDC.address, parseUnits("1000"), fakeWBTC.address, chainAId, 0, 0);
      balances = await userConnectionA.getUserBalances(account1.address, fakeWBTC.address);
      await expect(getBalanceDeposit(balances)).to.be.eq(parseUnits("0.9"));
      await expect(getBalanceLocked(balances)).to.be.eq(parseUnits("0.1"));

      const repayWithFee = reverseFee(parseUnits("500"));
      const fee = repayWithFee.sub(parseUnits("500"));

      await fakeUSDC.connect(account1).approve(crossChainLendingChainB.address, repayWithFee);
      await userConnectionB.repay(fakeUSDC.address, repayWithFee, fakeWBTC.address, chainAId, 0, 0);
      const finalUSDCBalance = await fakeUSDC.balanceOf(account1.address);
      await expect(finalUSDCBalance.sub(initialUSDCBalance)).to.be.eq(parseUnits("1000").sub(repayWithFee));

      balances = await userConnectionA.getUserBalances(account1.address, fakeWBTC.address);
      await expect(getBalanceDeposit(balances)).to.be.eq(parseUnits("0.95"));
      await expect(getBalanceLocked(balances)).to.be.eq(parseUnits("0.05"));

      const feeWalletUSDCBalance = await fakeUSDC.balanceOf(feeWallet.address);
      await expect(feeWalletUSDCBalance).to.be.eq(fee);
    });

    it("Should repay the full debt and unlock everything", async () => {
      await fakeWBTC.connect(account1).approve(crossChainLendingChainA.address, parseUnits("1"));
      await userConnectionA.deposit(fakeWBTC.address, parseUnits("1"));

      const initialUSDCBalance = await fakeUSDC.balanceOf(account1.address);
      let balances = await userConnectionA.getUserBalances(account1.address, fakeWBTC.address);
      await expect(getBalanceDeposit(balances)).to.be.eq(parseUnits("1"));
      await expect(getBalanceLocked(balances)).to.be.eq(parseUnits("0"));

      await userConnectionB.borrow(fakeUSDC.address, parseUnits("1000"), fakeWBTC.address, chainAId, 0, 0);
      balances = await userConnectionA.getUserBalances(account1.address, fakeWBTC.address);
      await expect(getBalanceDeposit(balances)).to.be.eq(parseUnits("0.9"));
      await expect(getBalanceLocked(balances)).to.be.eq(parseUnits("0.1"));

      // Somehow user should get enogth to pay the fee
      const repayWithFee = reverseFee(parseUnits("1000"));
      const fee = repayWithFee.sub(parseUnits("1000"));
      await fakeUSDC.transfer(account1.address, fee);

      await fakeUSDC.connect(account1).approve(crossChainLendingChainB.address, repayWithFee);
      await userConnectionB.repay(fakeUSDC.address, repayWithFee, fakeWBTC.address, chainAId, 0, 0);

      const finalUSDCBalance = await fakeUSDC.balanceOf(account1.address);
      await expect(finalUSDCBalance.sub(initialUSDCBalance)).to.be.eq(parseUnits("0"));

      balances = await userConnectionA.getUserBalances(account1.address, fakeWBTC.address);
      await expect(getBalanceDeposit(balances)).to.be.eq(parseUnits("1"));
      await expect(getBalanceLocked(balances)).to.be.eq(parseUnits("0"));

      const feeWalletUSDCBalance = await fakeUSDC.balanceOf(feeWallet.address);
      await expect(feeWalletUSDCBalance).to.be.eq(fee);
    });

    it("Should be liquidated", async () => {
      await fakeWBTC.connect(account1).approve(crossChainLendingChainA.address, parseUnits("1"));
      await userConnectionA.deposit(fakeWBTC.address, parseUnits("1"));

      const initialUSDCBalance = await fakeUSDC.balanceOf(account1.address);
      let balances = await userConnectionA.getUserBalances(account1.address, fakeWBTC.address);
      await expect(getBalanceDeposit(balances)).to.be.eq(parseUnits("1"));
      await expect(getBalanceLocked(balances)).to.be.eq(parseUnits("0"));

      await userConnectionB.borrow(fakeUSDC.address, parseUnits("1000"), fakeWBTC.address, chainAId, 0, 0);
      balances = await userConnectionA.getUserBalances(account1.address, fakeWBTC.address);
      await expect(getBalanceDeposit(balances)).to.be.eq(parseUnits("0.9"));
      await expect(getBalanceLocked(balances)).to.be.eq(parseUnits("0.1"));

      let canBeLiquidated = await userConnectionA.canBeLiquidated(fakeWBTC.address, account1.address);
      await expect(canBeLiquidated).to.be.eq(false);

      let call = userConnectionA.liquidate(fakeWBTC.address, account1.address);
      await expect(call).to.be.revertedWith(getCustomErrorMessage("CantBeLiquidated"));
      // let's change the BTC price from 20k to 10k
      const stableCoinAggregatorFactory = new StableCoinAggregator__factory(deployer);
      const BTCAggregator = await stableCoinAggregatorFactory.deploy(
        8,
        BigNumber.from(10000).mul(BigNumber.from(10).pow(8))
      );
      await oracleChainLink.setAggregator(fakeWBTC.address, BTCAggregator.address);

      canBeLiquidated = await userConnectionA.canBeLiquidated(fakeWBTC.address, account1.address);
      await expect(canBeLiquidated).to.be.eq(true);

      await crossChainLendingChainA.connect(account2).liquidate(fakeWBTC.address, account1.address);

      balances = await userConnectionA.getUserBalances(account1.address, fakeWBTC.address);
      await expect(getBalanceDeposit(balances)).to.be.eq(parseUnits("0.9"));
      await expect(getBalanceLocked(balances)).to.be.eq(parseUnits("0"));

      const liquidationUserRewarded = await fakeWBTC.balanceOf(account2.address);
      await expect(liquidationUserRewarded).to.be.eq(parseUnits("0.01"));

      const liquidationProtocolRewarded = await fakeWBTC.balanceOf(feeWallet.address);
      await expect(liquidationProtocolRewarded).to.be.eq(parseUnits("0.09"));
    });
  });
});
