import { BigNumber } from "@ethersproject/bignumber";
import { AddressZero } from "@ethersproject/constants";
import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getNonZetaAddress } from "@zetachain/protocol-contracts";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import {
  ERC20,
  IWETH,
  MockSystemContract,
  MockZRC20,
  RewardDistributor,
  RewardDistributorFactory,
  RewardDistributorFactory__factory,
} from "../typechain-types";
import { evmSetup } from "./test.helpers";

const REWARD_DURATION = BigNumber.from("604800"); // 1 week
const REWARDS_AMOUNT = parseEther("1000");
const ERROR_TOLERANCE = parseEther("0.1");

describe("LiquidityIncentives tests", () => {
  let ZETA: IWETH;
  let ZETA_ERC20: ERC20;
  let ZRC20Contracts: MockZRC20[];
  let ZRC20Contract: MockZRC20;
  let systemContract: MockSystemContract;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;

  let rewardDistributorFactory: RewardDistributorFactory;
  let rewardDistributorContract: RewardDistributor;

  const stakeToken = async (signer: SignerWithAddress, amount: BigNumber) => {
    const zetaNeeded = await rewardDistributorContract.otherTokenByAmount(ZRC20Contract.address, amount);
    await ZRC20Contract.transfer(signer.address, amount);
    await ZETA_ERC20.transfer(signer.address, zetaNeeded);

    await ZRC20Contract.connect(signer).approve(rewardDistributorContract.address, amount);
    await ZETA_ERC20.connect(signer).approve(rewardDistributorContract.address, zetaNeeded);

    return await rewardDistributorContract.connect(signer).addLiquidityAndStake(ZRC20Contract.address, amount);
  };

  const stakeZETA = async (signer: SignerWithAddress, amount: BigNumber) => {
    const zetaNeeded = await rewardDistributorContract.otherTokenByAmount(ZRC20Contract.address, amount);
    await ZRC20Contract.transfer(signer.address, amount);
    await ZETA_ERC20.transfer(signer.address, zetaNeeded);

    await ZRC20Contract.connect(signer).approve(rewardDistributorContract.address, amount);
    await ZETA_ERC20.connect(signer).approve(rewardDistributorContract.address, zetaNeeded);

    return await rewardDistributorContract.connect(signer).addLiquidityAndStake(ZETA_ERC20.address, zetaNeeded);
  };

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [deployer] = accounts;

    await network.provider.send("hardhat_setBalance", [deployer.address, parseUnits("1000000").toHexString()]);

    const uniswapRouterAddr = getNonZetaAddress("uniswapV2Router02", "eth_mainnet");

    const uniswapFactoryAddr = getNonZetaAddress("uniswapV2Factory", "eth_mainnet");

    const wGasToken = getNonZetaAddress("weth9", "eth_mainnet");

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

    const tx = await rewardDistributorFactory.createTokenIncentive(
      deployer.address,
      deployer.address,
      AddressZero,
      ZRC20Contract.address,
      AddressZero
    );
    const receipt = await tx.wait();
    const event = receipt.events?.find((e) => e.event === "RewardDistributorCreated");
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
      const tx = await rewardDistributorFactory.createTokenIncentive(
        deployer.address,
        deployer.address,
        AddressZero,
        ZRC20Contract.address,
        AddressZero
      );
      const receipt = await tx.wait();

      const event = receipt.events?.find((e) => e.event === "RewardDistributorCreated");
      expect(event).to.not.be.undefined;

      const { stakingTokenA, stakingTokenB, LPStakingToken, rewardsToken, owner } = event?.args as any;
      expect(stakingTokenA).to.be.eq(ZRC20Contract.address);
      expect(stakingTokenB).to.be.eq(ZETA.address);
      const LPTokenAddress = await systemContract.uniswapv2PairFor(
        uniswapv2FactoryAddress,
        ZRC20Contract.address,
        ZETA.address
      );
      expect(LPStakingToken).to.be.eq(LPTokenAddress);
      expect(rewardsToken).to.be.eq(ZETA.address);
      expect(owner).to.be.eq(deployer.address);
    });
  });

  it("Should create an incentive", async () => {
    await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);
    const rewardRate = await rewardDistributorContract.rewardRate();
    expect(rewardRate).to.be.closeTo(REWARDS_AMOUNT.div(REWARD_DURATION), ERROR_TOLERANCE);
  });

  it("Should store incentive contract in registry", async () => {
    const initialIncentivesContractsLen = await rewardDistributorFactory.incentivesContractsLen();
    const tx = await rewardDistributorFactory.createTokenIncentive(
      deployer.address,
      deployer.address,
      AddressZero,
      ZRC20Contract.address,
      AddressZero
    );
    const receipt = await tx.wait();

    const event = receipt.events?.find((e) => e.event === "RewardDistributorCreated");
    expect(event).to.not.be.undefined;

    const { rewardDistributorContract } = event?.args as any;
    expect(rewardDistributorContract).to.not.be.undefined;

    const finalIncentivesContractsLen = await rewardDistributorFactory.incentivesContractsLen();
    expect(initialIncentivesContractsLen).to.be.eq(finalIncentivesContractsLen.sub(1));
    const incentivesContract = await rewardDistributorFactory.incentivesContracts(finalIncentivesContractsLen.sub(1));
    expect(incentivesContract).to.be.eq(rewardDistributorContract);
  });

  it("Should calculate the token required to swap", async () => {
    const zetaRequired = await rewardDistributorContract.otherTokenByAmount(ZRC20Contract.address, parseEther("10"));
    const tokenRequired = await rewardDistributorContract.otherTokenByAmount(ZETA.address, parseEther("10"));
    // @dev This validation works because we create all the liquidity for this test with 1 ZETA:2 Token ratio (see addZetaEthLiquidity)
    expect(zetaRequired).to.be.closeTo(parseEther("5"), ERROR_TOLERANCE);
    expect(tokenRequired).to.be.closeTo(parseEther("20"), ERROR_TOLERANCE);
  });

  it("Should create an incentive and should be able to use it", async () => {
    await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

    const sampleAccount = accounts[0];
    const stakedAmount = parseEther("100");

    await stakeToken(sampleAccount, stakedAmount);

    await network.provider.send("evm_increaseTime", [REWARD_DURATION.div(2).toNumber()]);
    await network.provider.send("evm_mine");

    const earned = await rewardDistributorContract.earned(sampleAccount.address);
    expect(earned).to.be.closeTo(REWARDS_AMOUNT.div(2), ERROR_TOLERANCE);
  });

  it("Should create an incentive and should be able to use it reverse tokens", async () => {
    await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

    const sampleAccount = accounts[0];
    const stakedAmount = parseEther("100");

    await stakeZETA(sampleAccount, stakedAmount);

    await network.provider.send("evm_increaseTime", [REWARD_DURATION.div(2).toNumber()]);
    await network.provider.send("evm_mine");

    const earned = await rewardDistributorContract.earned(sampleAccount.address);
    expect(earned).to.be.closeTo(REWARDS_AMOUNT.div(2), ERROR_TOLERANCE);
  });

  it("Should create an incentive and should be able to use it using stake", async () => {
    await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

    const sampleAccount = accounts[0];
    const stakedAmount = parseEther("100");

    // await stakeToken(sampleAccount, stakedAmount);
    const uniswapRouterAddr = getNonZetaAddress("uniswapV2Router02", "eth_mainnet");
    const zetaNeeded = await rewardDistributorContract.otherTokenByAmount(ZRC20Contract.address, stakedAmount);
    await ZRC20Contract.transfer(sampleAccount.address, stakedAmount);
    await ZETA_ERC20.transfer(sampleAccount.address, zetaNeeded);

    await ZRC20Contract.connect(sampleAccount).approve(uniswapRouterAddr, stakedAmount);
    await ZETA_ERC20.connect(sampleAccount).approve(uniswapRouterAddr, zetaNeeded);

    const uniswapRouter = (await ethers.getContractAt("IUniswapV2Router02", uniswapRouterAddr)) as any;
    const deadline = (await ethers.provider.getBlock("latest")).timestamp + 1000000;
    await uniswapRouter.addLiquidity(
      ZRC20Contract.address,
      ZETA.address,
      stakedAmount,
      zetaNeeded,
      0,
      0,
      sampleAccount.address,
      deadline
    );

    const LPTokenAddress = await systemContract.uniswapv2PairFor(
      await systemContract.uniswapv2FactoryAddress(),
      ZRC20Contract.address,
      ZETA.address
    );

    const ERC20Contract = (await ethers.getContractAt("ERC20", LPTokenAddress)) as any;
    const LPBalance = await ERC20Contract.balanceOf(sampleAccount.address);

    await ERC20Contract.connect(sampleAccount).approve(rewardDistributorContract.address, LPBalance);
    await rewardDistributorContract.connect(sampleAccount).stake(LPBalance);

    await network.provider.send("evm_increaseTime", [REWARD_DURATION.div(2).toNumber()]);
    await network.provider.send("evm_mine");

    const earned = await rewardDistributorContract.earned(sampleAccount.address);
    expect(earned).to.be.closeTo(REWARDS_AMOUNT.div(2), ERROR_TOLERANCE);
  });

  it("Should distribute rewards between two users", async () => {
    await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

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

    await rewardDistributorContract.connect(sampleAccount1).getReward(false);
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount1.address);
    expect(zetaBalance).to.be.closeTo(REWARDS_AMOUNT.div(2), ERROR_TOLERANCE);
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount2.address);
    expect(zetaBalance).to.be.eq(0);

    await rewardDistributorContract.connect(sampleAccount2).getReward(false);
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount1.address);
    expect(zetaBalance).to.be.closeTo(REWARDS_AMOUNT.div(2), ERROR_TOLERANCE);
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount2.address);
    expect(zetaBalance).to.be.closeTo(REWARDS_AMOUNT.div(2), ERROR_TOLERANCE);
  });

  it("Should distribute rewards between two users different proportion", async () => {
    await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

    const sampleAccount1 = accounts[3];
    const sampleAccount2 = accounts[4];
    const stakedAmount1 = parseEther("30");
    const stakedAmount2 = parseEther("10");

    await stakeToken(sampleAccount1, stakedAmount1);
    await stakeToken(sampleAccount2, stakedAmount2);

    await network.provider.send("evm_increaseTime", [REWARD_DURATION.div(2).toNumber()]);
    await network.provider.send("evm_mine");

    let earned1 = await rewardDistributorContract.earned(sampleAccount1.address);
    expect(earned1).to.be.closeTo(REWARDS_AMOUNT.div(2).div(4).mul(3), ERROR_TOLERANCE);

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

    await rewardDistributorContract.connect(sampleAccount1).getReward(false);
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount1.address);
    expect(zetaBalance).to.be.closeTo(REWARDS_AMOUNT.div(4).mul(3), ERROR_TOLERANCE);
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount2.address);
    expect(zetaBalance).to.be.eq(0);

    await rewardDistributorContract.connect(sampleAccount2).getReward(false);
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount1.address);
    expect(zetaBalance).to.be.closeTo(REWARDS_AMOUNT.div(4).mul(3), ERROR_TOLERANCE);
    zetaBalance = await ZETA_ERC20.balanceOf(sampleAccount2.address);
    expect(zetaBalance).to.be.closeTo(REWARDS_AMOUNT.div(4), ERROR_TOLERANCE);
  });

  it("Should prevent unstaking when minimum staking period has not elapsed", async () => {
    const MIN_STAKING_PERIOD = 1000;
    await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    await rewardDistributorContract.setMinStakingPeriod(MIN_STAKING_PERIOD);
    await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

    const sampleAccount = accounts[0];
    const stakedAmount = parseEther("100");

    await stakeToken(sampleAccount, stakedAmount);

    await network.provider.send("evm_increaseTime", [MIN_STAKING_PERIOD - 2]);
    await network.provider.send("evm_mine");

    const LPStaked = await rewardDistributorContract.balanceOf(sampleAccount.address);
    const withdraw = rewardDistributorContract.connect(sampleAccount).withdraw(LPStaked);
    await expect(withdraw).to.be.revertedWith("MinimumStakingPeriodNotMet");
  });

  it("Should prevent starting cool down when minimum staking period has not passed", async () => {
    const MIN_STAKING_PERIOD = 1000;
    await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    await rewardDistributorContract.setMinStakingPeriod(MIN_STAKING_PERIOD);
    await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

    const sampleAccount = accounts[0];
    const stakedAmount = parseEther("100");

    await stakeToken(sampleAccount, stakedAmount);

    await network.provider.send("evm_increaseTime", [MIN_STAKING_PERIOD - 3]);
    await network.provider.send("evm_mine");

    const withdraw = rewardDistributorContract.connect(sampleAccount).beginCoolDown();
    await expect(withdraw).to.be.revertedWith("MinimumStakingPeriodNotMet");
  });

  it("Should allow unstaking when minimum staking period has been fulfilled", async () => {
    const MIN_STAKING_PERIOD = 1000;
    await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    await rewardDistributorContract.setMinStakingPeriod(MIN_STAKING_PERIOD);
    await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

    const sampleAccount = accounts[0];
    const stakedAmount = parseEther("100");

    await stakeToken(sampleAccount, stakedAmount);

    await network.provider.send("evm_increaseTime", [MIN_STAKING_PERIOD + 2]);
    await network.provider.send("evm_mine");

    await rewardDistributorContract.connect(sampleAccount).beginCoolDown();

    const LPStaked = await rewardDistributorContract.balanceOf(sampleAccount.address);
    const withdraw = rewardDistributorContract.connect(sampleAccount).withdraw(LPStaked);
    await expect(withdraw).not.to.be.reverted;
  });

  it("Should prevent unstaking when minimum cool down period has not been reached", async () => {
    const MIN_STAKING_PERIOD = 1000;
    const MIN_COOL_DOWN = 1000;
    await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    await rewardDistributorContract.setMinStakingPeriod(MIN_STAKING_PERIOD);
    await rewardDistributorContract.setMinCoolDown(MIN_COOL_DOWN);
    await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

    const sampleAccount = accounts[0];
    const stakedAmount = parseEther("100");

    await stakeToken(sampleAccount, stakedAmount);

    await network.provider.send("evm_increaseTime", [MIN_STAKING_PERIOD + 2]);
    await network.provider.send("evm_mine");

    await rewardDistributorContract.connect(sampleAccount).beginCoolDown();

    const LPStaked = await rewardDistributorContract.balanceOf(sampleAccount.address);
    const withdraw = rewardDistributorContract.connect(sampleAccount).withdraw(LPStaked);
    await expect(withdraw).to.be.revertedWith("MinimumStakingPeriodNotMet");
  });

  it("Should allow unstaking when minimum cool down period has been satisfied", async () => {
    const MIN_STAKING_PERIOD = 1000;
    const MIN_COOL_DOWN = 1000;
    await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    await rewardDistributorContract.setMinStakingPeriod(MIN_STAKING_PERIOD);
    await rewardDistributorContract.setMinCoolDown(MIN_COOL_DOWN);
    await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

    const sampleAccount = accounts[0];
    const stakedAmount = parseEther("100");

    await stakeToken(sampleAccount, stakedAmount);

    await network.provider.send("evm_increaseTime", [MIN_STAKING_PERIOD + 2]);
    await network.provider.send("evm_mine");

    await rewardDistributorContract.connect(sampleAccount).beginCoolDown();

    await network.provider.send("evm_increaseTime", [MIN_COOL_DOWN + 2]);
    await network.provider.send("evm_mine");

    const LPStaked = await rewardDistributorContract.balanceOf(sampleAccount.address);
    const withdraw = rewardDistributorContract.connect(sampleAccount).withdraw(LPStaked);
    await expect(withdraw).not.to.be.reverted;
  });

  it("Should prevent exit when minimum staking period has not elapsed", async () => {
    const MIN_STAKING_PERIOD = 1000;
    await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    await rewardDistributorContract.setMinStakingPeriod(MIN_STAKING_PERIOD);
    await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

    const sampleAccount = accounts[0];
    const stakedAmount = parseEther("100");

    await stakeToken(sampleAccount, stakedAmount);

    await network.provider.send("evm_increaseTime", [MIN_STAKING_PERIOD - 2]);
    await network.provider.send("evm_mine");

    const withdraw = rewardDistributorContract.connect(sampleAccount).exit(false);
    await expect(withdraw).to.be.revertedWith("MinimumStakingPeriodNotMet");
  });

  it("Should prevent exit when minimum cool down period has not been reached", async () => {
    const MIN_STAKING_PERIOD = 1000;
    const MIN_COOL_DOWN = 1000;
    await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    await rewardDistributorContract.setMinStakingPeriod(MIN_STAKING_PERIOD);
    await rewardDistributorContract.setMinCoolDown(MIN_COOL_DOWN);
    await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

    const sampleAccount = accounts[0];
    const stakedAmount = parseEther("100");

    await stakeToken(sampleAccount, stakedAmount);

    await network.provider.send("evm_increaseTime", [MIN_STAKING_PERIOD + 2]);
    await network.provider.send("evm_mine");

    await rewardDistributorContract.connect(sampleAccount).beginCoolDown();

    const withdraw = rewardDistributorContract.connect(sampleAccount).exit(false);
    await expect(withdraw).to.be.revertedWith("MinimumStakingPeriodNotMet");
  });

  it("Should distribute rewards between two users using native token", async () => {
    await ZETA.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

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
    const zetaInitialBalanceAccount1 = await ethers.provider.getBalance(sampleAccount1.address);
    const zetaInitialBalanceAccount2 = await ethers.provider.getBalance(sampleAccount2.address);

    await rewardDistributorContract.connect(sampleAccount1).getReward(true);
    zetaBalance = await ethers.provider.getBalance(sampleAccount1.address);
    expect(zetaBalance.sub(zetaInitialBalanceAccount1)).to.be.closeTo(REWARDS_AMOUNT.div(2), ERROR_TOLERANCE);
    zetaBalance = await ethers.provider.getBalance(sampleAccount2.address);
    expect(zetaBalance.sub(zetaInitialBalanceAccount2)).to.be.eq(0);

    await rewardDistributorContract.connect(sampleAccount2).getReward(true);
    zetaBalance = await ethers.provider.getBalance(sampleAccount1.address);
    expect(zetaBalance.sub(zetaInitialBalanceAccount1)).to.be.closeTo(REWARDS_AMOUNT.div(2), ERROR_TOLERANCE);
    zetaBalance = await ethers.provider.getBalance(sampleAccount2.address);
    expect(zetaBalance.sub(zetaInitialBalanceAccount2)).to.be.closeTo(REWARDS_AMOUNT.div(2), ERROR_TOLERANCE);
  });

  it("Should fail if rewards token is not ZETA", async () => {
    const rewardToken = ZRC20Contracts[1];
    const tx = await rewardDistributorFactory.createTokenIncentive(
      deployer.address,
      deployer.address,
      rewardToken.address,
      ZRC20Contract.address,
      AddressZero
    );
    const receipt = await tx.wait();
    const event = receipt.events?.find((e) => e.event === "RewardDistributorCreated");
    expect(event).to.not.be.undefined;

    const { rewardDistributorContract: rewardDistributorContractAddress } = event?.args as any;
    rewardDistributorContract = (await ethers.getContractAt(
      "RewardDistributor",
      rewardDistributorContractAddress
    )) as RewardDistributor;

    await rewardToken.transfer(rewardDistributorContract.address, REWARDS_AMOUNT);
    await rewardDistributorContract.setRewardsDuration(REWARD_DURATION);
    await rewardDistributorContract.notifyRewardAmount(REWARDS_AMOUNT);

    const sampleAccount1 = accounts[1];
    const stakedAmount1 = parseEther("100");

    await stakeToken(sampleAccount1, stakedAmount1);

    await network.provider.send("evm_increaseTime", [REWARD_DURATION.div(2).toNumber()]);
    await network.provider.send("evm_mine");

    const getReward = rewardDistributorContract.connect(sampleAccount1).getReward(true);
    await expect(getReward).to.be.revertedWith("Reward is not a wrapped asset");
  });

  it("Should return incentive contracts", async () => {
    const rewardToken = ZRC20Contracts[1];
    const tx = await rewardDistributorFactory.createTokenIncentive(
      deployer.address,
      deployer.address,
      rewardToken.address,
      ZRC20Contract.address,
      AddressZero
    );
    const receipt = await tx.wait();
    const event = receipt.events?.find((e) => e.event === "RewardDistributorCreated");
    expect(event).to.not.be.undefined;

    const { rewardDistributorContract: rewardDistributorContractAddress1 } = event?.args as any;

    const tx2 = await rewardDistributorFactory.createTokenIncentive(
      deployer.address,
      deployer.address,
      rewardToken.address,
      ZRC20Contract.address,
      AddressZero
    );
    const receipt2 = await tx2.wait();
    const event2 = receipt2.events?.find((e) => e.event === "RewardDistributorCreated");
    expect(event2).to.not.be.undefined;

    const { rewardDistributorContract: rewardDistributorContractAddress2 } = event2?.args as any;

    // @dev: on setup is already deployed a rewardDistributorContract
    const incentiveContracts = await rewardDistributorFactory.getIncentiveContracts();
    expect(incentiveContracts[1]).to.be.eq(rewardDistributorContractAddress1);
    expect(incentiveContracts[2]).to.be.eq(rewardDistributorContractAddress2);
  });

  it("Should be pausable", async () => {
    const paused1 = await rewardDistributorContract.paused();
    expect(paused1).to.be.false;

    await rewardDistributorContract.setPaused(true);
    const paused2 = await rewardDistributorContract.paused();
    expect(paused2).to.be.true;
  });

  it("Should be pausable even the same value", async () => {
    const paused1 = await rewardDistributorContract.paused();
    expect(paused1).to.be.false;

    await rewardDistributorContract.setPaused(false);
    const paused2 = await rewardDistributorContract.paused();
    expect(paused2).to.be.false;
  });
});
