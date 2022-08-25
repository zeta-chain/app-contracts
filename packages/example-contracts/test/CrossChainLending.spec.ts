import { smock } from "@defi-wonderland/smock";
import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { IERC20 } from "@zetachain/interfaces/typechain-types";
import chai, { expect } from "chai";
import { formatUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";

import { getMultiChainSwapZetaConnector } from "../lib/multi-chain-swap/MultiChainSwap.helpers";
import { getZetaMock } from "../lib/shared/deploy.helpers";
import {
  CrossChainLending,
  CrossChainLending__factory,
  CrossChainLendingZetaConnector__factory,
  ERC20,
  ERC20__factory,
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
    const crossChainLendingChain = await crossChainLendingFactory.deploy(
      zetaConnectorMock.address,
      zetaTokenMock.address
    );
    await crossChainLendingChain.setOracle(oracleChainLink.address);
    await crossChainLendingChain.setAllowedToken(fakeWETH.address, true);
    await crossChainLendingChain.setRiskTable(fakeWETH.address, 2);
    await crossChainLendingChain.setAllowedToken(fakeWBTC.address, true);
    await crossChainLendingChain.setRiskTable(fakeWBTC.address, 2);
    await crossChainLendingChain.setAllowedToken(fakeUSDC.address, true);
    await crossChainLendingChain.setRiskTable(fakeUSDC.address, 2);

    return crossChainLendingChain;
  };

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [deployer, account1] = accounts;

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
      let ret = await oracleChainLink.quote(WETH_ADDRESS, parseUnits("13.55377"), WBTC_ADDRESS);
      await expect(formatUnits(ret, 8)).to.be.eq("1.00023313");

      ret = await oracleChainLink.quote(WETH_ADDRESS, parseUnits("1"), USDC_ADDRESS);
      await expect(formatUnits(ret, 6)).to.be.eq("2929.752709");

      ret = await oracleChainLink.quote(USDC_ADDRESS, parseUnits("2929.75270932"), WETH_ADDRESS);
      await expect(formatUnits(ret, 18)).to.be.eq("1.0");

      ret = await oracleChainLink.quote(USDC_ADDRESS, parseUnits("2929.75270932").div(2), WETH_ADDRESS);
      await expect(formatUnits(ret, 18)).to.be.eq("0.5");
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

      await userConnectionB.borrow(fakeUSDC.address, parseUnits("1000"), fakeWETH.address, chainAId);
      const finalUSDCBalance = await fakeUSDC.balanceOf(account1.address);
      await expect(finalUSDCBalance.sub(initialUSDCBalance)).to.be.eq(parseUnits("1000"));
    });

    it("Should fail if not enoght collateral", async () => {
      // ETH  2929.75270932;
      // BTC 39699.93878572;
      // USDC 1.0

      await fakeWETH.connect(account1).approve(crossChainLendingChainA.address, parseUnits("1"));
      await userConnectionA.deposit(fakeWETH.address, parseUnits("1"));

      const call = userConnectionB.borrow(fakeUSDC.address, parseUnits("1500"), fakeWETH.address, chainAId);
      await expect(call).to.be.revertedWith(getCustomErrorMessage("NotEnoughCollateral"));
    });
  });
});
