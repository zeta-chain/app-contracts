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

  let oracleChainLink: OracleChainLink;

  let fakeWETH: ERC20;
  let fakeWBTC: ERC20;
  let fakeUSDC: ERC20;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;

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

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [deployer] = accounts;

    zetaTokenMock = await getZetaMock();
    await deployTokensAndOracle();
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
});
