import { BigNumber } from "@ethersproject/bignumber";
import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getAddress as getAddressLib } from "@zetachain/addresses";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import {
  ERC20,
  IWETH,
  RewardDistributor,
  RewardDistributorFactory,
  RewardDistributorFactory__factory,
  TestSystemContract,
  TestZRC20
} from "../typechain-types";
import { evmSetup } from "./test.helpers";

const REWARD_DURATION = BigNumber.from("604800"); // 1 week
const REWARDS_AMOUNT = parseEther("1000");
const ERROR_TOLERANCE = parseEther("0.1");

describe("LiquidityIncentives tests", () => {
  let ZETA: IWETH;
  let ZETA_ERC20: ERC20;
  let ZRC20Contracts: TestZRC20[];
  let ZRC20Contract: TestZRC20;
  let systemContract: TestSystemContract;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;

  let rewardDistributorFactory: RewardDistributorFactory;
  let rewardDistributorContract: RewardDistributor;

  const stakeToken = async (signer: SignerWithAddress, amount: BigNumber) => {
    const zetaNeeded = await rewardDistributorContract.zetaByTokenAmount(ZRC20Contract.address, amount);
    await ZRC20Contract.transfer(signer.address, amount);
    await ZETA_ERC20.transfer(signer.address, zetaNeeded);

    await ZRC20Contract.connect(signer).approve(rewardDistributorContract.address, amount);
    await ZETA_ERC20.connect(signer).approve(rewardDistributorContract.address, zetaNeeded);

    await rewardDistributorContract.connect(signer).addLiquidityAndStake(ZRC20Contract.address, amount);
  };

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

    ZETA = (await ethers.getContractAt("IWETH", wGasToken)) as IWETH;
    ZETA_ERC20 = (await ethers.getContractAt("ERC20", wGasToken)) as ERC20;
    await ZETA.deposit({ value: parseEther("10000") });

    const evmSetupResult = await evmSetup(wGasToken, uniswapFactoryAddr, uniswapRouterAddr);
    ZRC20Contracts = evmSetupResult.ZRC20Contracts;
    ZRC20Contract = ZRC20Contracts[0];
    systemContract = evmSetupResult.systemContract;

    const RewardDistributorFactoryFactory = (await ethers.getContractFactory(
      "RewardDistributorFactory"
    )) as RewardDistributorFactory__factory;
    rewardDistributorFactory = (await RewardDistributorFactoryFactory.deploy(
      wGasToken,
      systemContract.address
    )) as RewardDistributorFactory;
    await rewardDistributorFactory.deployed();

    const tx = await rewardDistributorFactory.createIncentive(
      deployer.address,
      deployer.address,
      ZRC20Contract.address
    );
    const receipt = await tx.wait();
    const event = receipt.events?.find(e => e.event === "RewardDistributorCreated");
    expect(event).to.not.be.undefined;

    const { rewardDistributorContract: rewardDistributorContractAddress } = event?.args as any;
    rewardDistributorContract = (await ethers.getContractAt(
      "RewardDistributor",
      rewardDistributorContractAddress
    )) as RewardDistributor;
  });

  describe("LiquidityIncentives", () => {
    it("Should create an incentive contract", async () => {
      const uniswapv2FactoryAddress = await systemContract.uniswapv2FactoryAddress();
      const tx = await rewardDistributorFactory.createIncentive(
        deployer.address,
        deployer.address,
        ZRC20Contract.address
      );
      const receipt = await tx.wait();

      const event = receipt.events?.find(e => e.event === "RewardDistributorCreated");
      expect(event).to.not.be.undefined;

      const { stakingToken, LPStakingToken, rewardToken, owner } = event?.args as any;
      expect(stakingToken).to.be.eq(ZRC20Contract.address);
      const LPTokenAddress = await systemContract.uniswapv2PairFor(
        uniswapv2FactoryAddress,
        ZRC20Contract.address,
        ZETA.address
      );
      expect(LPStakingToken).to.be.eq(LPTokenAddress);
      expect(rewardToken).to.be.eq(ZETA.address);
      expect(owner).to.be.eq(deployer.address);
    });
  });

  it("Should create an incentive", async () => {
    let tx = await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    tx = await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    tx = await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);
    const rewardRate = await rewardDistributorContract.rewardRate();
    expect(rewardRate).to.be.closeTo(REWARDS_AMOUNT.div(REWARD_DURATION), ERROR_TOLERANCE);
  });

  it("Should create an incentive and should be able to use it", async () => {
    let tx = await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    tx = await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    tx = await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

    const sampleAccount = accounts[0];
    const stakedAmount = parseEther("100");

    await stakeToken(sampleAccount, stakedAmount);

    await network.provider.send("evm_increaseTime", [REWARD_DURATION.div(2).toNumber()]);
    await network.provider.send("evm_mine");

    const earned = await rewardDistributorContract.earned(sampleAccount.address);
    expect(earned).to.be.closeTo(REWARDS_AMOUNT.div(2), ERROR_TOLERANCE);
  });

  it("Should distribute rewards between two users", async () => {
    let tx = await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    tx = await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    tx = await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

    const sampleAccount1 = accounts[1];
    const sampleAccount2 = accounts[2];
    const stakedAmount1 = parseEther("100");
    const stakedAmount2 = parseEther("100");

    await stakeToken(sampleAccount1, stakedAmount1);
    await stakeToken(sampleAccount2, stakedAmount2);

    await network.provider.send("evm_increaseTime", [REWARD_DURATION.div(2).toNumber()]);
    await network.provider.send("evm_mine");

    let earned1 = await rewardDistributorContract.earned(sampleAccount1.address);
    expect(earned1).to.be.closeTo(REWARDS_AMOUNT.div(4), ERROR_TOLERANCE);

    let earned2 = await rewardDistributorContract.earned(sampleAccount2.address);
    expect(earned2).to.be.closeTo(REWARDS_AMOUNT.div(4), ERROR_TOLERANCE);

    await network.provider.send("evm_increaseTime", [REWARD_DURATION.div(2).toNumber()]);
    await network.provider.send("evm_mine");

    earned1 = await rewardDistributorContract.earned(sampleAccount1.address);
    expect(earned1).to.be.closeTo(REWARDS_AMOUNT.div(2), ERROR_TOLERANCE);
    earned2 = await rewardDistributorContract.earned(sampleAccount2.address);
    expect(earned2).to.be.closeTo(REWARDS_AMOUNT.div(2), ERROR_TOLERANCE);

    let zetaBalance = BigNumber.from(0);
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount1.address);
    expect(zetaBalance).to.be.eq(0);
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount2.address);
    expect(zetaBalance).to.be.eq(0);

    tx = await rewardDistributorContract.connect(sampleAccount1).getReward();
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount1.address);
    expect(zetaBalance).to.be.closeTo(REWARDS_AMOUNT.div(2), ERROR_TOLERANCE);
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount2.address);
    expect(zetaBalance).to.be.eq(0);

    tx = await rewardDistributorContract.connect(sampleAccount2).getReward();
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount1.address);
    expect(zetaBalance).to.be.closeTo(REWARDS_AMOUNT.div(2), ERROR_TOLERANCE);
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount2.address);
    expect(zetaBalance).to.be.closeTo(REWARDS_AMOUNT.div(2), ERROR_TOLERANCE);
  });

  it("Should distribute rewards between two users different proportion", async () => {
    let tx = await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    tx = await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    tx = await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

    const sampleAccount1 = accounts[3];
    const sampleAccount2 = accounts[4];
    const stakedAmount1 = parseEther("30");
    const stakedAmount2 = parseEther("10");

    await stakeToken(sampleAccount1, stakedAmount1);
    await stakeToken(sampleAccount2, stakedAmount2);

    await network.provider.send("evm_increaseTime", [REWARD_DURATION.div(2).toNumber()]);
    await network.provider.send("evm_mine");

    let earned1 = await rewardDistributorContract.earned(sampleAccount1.address);
    expect(earned1).to.be.closeTo(
      REWARDS_AMOUNT.div(2)
        .div(4)
        .mul(3),
      ERROR_TOLERANCE
    );

    let earned2 = await rewardDistributorContract.earned(sampleAccount2.address);
    expect(earned2).to.be.closeTo(REWARDS_AMOUNT.div(2).div(4), ERROR_TOLERANCE);

    await network.provider.send("evm_increaseTime", [REWARD_DURATION.div(2).toNumber()]);
    await network.provider.send("evm_mine");

    earned1 = await rewardDistributorContract.earned(sampleAccount1.address);
    expect(earned1).to.be.closeTo(REWARDS_AMOUNT.div(4).mul(3), ERROR_TOLERANCE);
    earned2 = await rewardDistributorContract.earned(sampleAccount2.address);
    expect(earned2).to.be.closeTo(REWARDS_AMOUNT.div(4), ERROR_TOLERANCE);

    let zetaBalance = BigNumber.from(0);
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount1.address);
    expect(zetaBalance).to.be.eq(0);
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount2.address);
    expect(zetaBalance).to.be.eq(0);

    tx = await rewardDistributorContract.connect(sampleAccount1).getReward();
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount1.address);
    expect(zetaBalance).to.be.closeTo(REWARDS_AMOUNT.div(4).mul(3), ERROR_TOLERANCE);
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount2.address);
    expect(zetaBalance).to.be.eq(0);

    tx = await rewardDistributorContract.connect(sampleAccount2).getReward();
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount1.address);
    expect(zetaBalance).to.be.closeTo(REWARDS_AMOUNT.div(4).mul(3), ERROR_TOLERANCE);
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount2.address);
    expect(zetaBalance).to.be.closeTo(REWARDS_AMOUNT.div(4), ERROR_TOLERANCE);
  });
});
