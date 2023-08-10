import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import { MockZRC20, MockZRC20__factory, StakingRewards, StakingRewards__factory } from "../../typechain-types";

const { assert, addSnapshotBeforeRestoreAfterEach } = require("./common");

const { currentTime, fastForward } = require("./utils")();

const toUnit = parseEther;

const mockToken = async (acount: SignerWithAddress, name: string, symbol: string) => {
  const ZRC20Factory = (await ethers.getContractFactory("MockZRC20")) as MockZRC20__factory;
  const token = (await ZRC20Factory.connect(acount).deploy(parseUnits("1000000"), name, symbol)) as MockZRC20;
  return token;
};

describe("StakingRewards", () => {
  let owner: any, stakingAccount1: any, rewardsDistribution: any;

  // Synthetix is the rewardsToken
  let rewardsToken: any, stakingToken: any, externalRewardsToken: any, stakingRewards: any;

  const DAY = 86400;
  const ZERO_BN = BigNumber.from(0);

  addSnapshotBeforeRestoreAfterEach();

  before(async () => {
    const accounts = await ethers.getSigners();
    owner = accounts[0];
    stakingAccount1 = accounts[1];
    rewardsDistribution = accounts[2];

    stakingToken = await mockToken(owner, "Staking Token", "STKN");
    externalRewardsToken = await mockToken(owner, "External Rewards Token", "MOAR");
    rewardsToken = await mockToken(owner, "Synthetix", "SNK");

    const StakingRewardsFactory = (await ethers.getContractFactory("StakingRewards")) as StakingRewards__factory;
    stakingRewards = (await StakingRewardsFactory.deploy(
      owner.address,
      rewardsDistribution.address,
      rewardsToken.address,
      stakingToken.address
    )) as StakingRewards;
    await stakingRewards.deployed();
  });

  describe("Constructor & Settings", () => {
    it("should set rewards token on constructor", async () => {
      assert.equal(await stakingRewards.rewardsToken(), rewardsToken.address);
    });

    it("should staking token on constructor", async () => {
      assert.equal(await stakingRewards.stakingToken(), stakingToken.address);
    });

    it("should set owner on constructor", async () => {
      const ownerAddress = await stakingRewards.owner();
      assert.equal(ownerAddress, owner.address);
    });
  });

  describe("Function permissions", () => {
    const rewardValue = toUnit("1.0");

    before(async () => {
      await rewardsToken.connect(owner).transfer(stakingRewards.address, rewardValue);
    });
  });

  describe("Pausable", async () => {
    beforeEach(async () => {
      await stakingRewards.connect(owner).setPaused(true);
    });
    it("should revert calling stake() when paused", async () => {
      const totalToStake = toUnit("100");
      await stakingToken.connect(owner).transfer(stakingAccount1.address, totalToStake);
      await stakingToken.connect(stakingAccount1).approve(stakingRewards.address, totalToStake);

      await assert.revert(
        stakingRewards.connect(stakingAccount1).stake(totalToStake),
        "This action cannot be performed while the contract is paused"
      );
    });
    it("should not revert calling stake() when unpaused", async () => {
      await stakingRewards.connect(owner).setPaused(false);

      const totalToStake = toUnit("100");
      await stakingToken.connect(owner).transfer(stakingAccount1.address, totalToStake);
      await stakingToken.connect(stakingAccount1).approve(stakingRewards.address, totalToStake);

      await stakingRewards.connect(stakingAccount1).stake(totalToStake);
    });
  });

  describe("External Rewards Recovery", () => {
    const amount = toUnit("5000");
    beforeEach(async () => {
      // Send ERC20 to StakingRewards Contract
      await externalRewardsToken.connect(owner).transfer(stakingRewards.address, amount);
      assert.bnEqual(await externalRewardsToken.balanceOf(stakingRewards.address), amount);
    });
    it("only owner can call recoverERC20", async () => {
      const accounts = await ethers.getSigners();
      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        if (account.address !== owner.address) {
          await assert.revert(
            stakingRewards.connect(account).recoverERC20(externalRewardsToken.address, amount),
            "Only the contract owner may perform this action"
          );
        } else {
          await stakingRewards.connect(account).recoverERC20(externalRewardsToken.address, amount);
        }
      }
    });
    it("should revert if recovering staking token", async () => {
      await assert.revert(
        stakingRewards.connect(owner).recoverERC20(stakingToken.address, amount),
        "Cannot withdraw the staking token"
      );
    });
    it("should retrieve external token from StakingRewards and reduce contracts balance", async () => {
      await stakingRewards.connect(owner).recoverERC20(externalRewardsToken.address, amount);
      assert.bnEqual(await externalRewardsToken.balanceOf(stakingRewards.address), ZERO_BN);
    });
    it("should retrieve external token from StakingRewards and increase owners balance", async () => {
      const ownerMOARBalanceBefore = await externalRewardsToken.balanceOf(owner.address);

      await stakingRewards.connect(owner).recoverERC20(externalRewardsToken.address, amount);

      const ownerMOARBalanceAfter = await externalRewardsToken.balanceOf(owner.address);
      assert.bnEqual(ownerMOARBalanceAfter.sub(ownerMOARBalanceBefore), amount);
    });
    it("should emit Recovered event", async () => {
      const transaction = await stakingRewards.connect(owner).recoverERC20(externalRewardsToken.address, amount);
      const receipt = await transaction.wait();
      const event = receipt.events?.find((e: any) => e.event === "Recovered");
      assert.eventEqual(event, "Recovered", {
        amount: amount,
        token: externalRewardsToken.address
      });
    });
  });

  describe("lastTimeRewardApplicable()", () => {
    it("should return 0", async () => {
      assert.bnEqual(await stakingRewards.lastTimeRewardApplicable(), ZERO_BN);
    });

    describe("when updated", () => {
      it("should equal current timestamp", async () => {
        await rewardsToken.connect(owner).transfer(stakingRewards.address, toUnit("1"));
        await stakingRewards.connect(rewardsDistribution).notifyRewardAmount(toUnit("1"));

        const cur = await currentTime();
        const lastTimeReward = await stakingRewards.lastTimeRewardApplicable();

        assert.equal(cur.toString(), lastTimeReward.toString());
      });
    });
  });

  describe("rewardPerToken()", () => {
    it("should return 0", async () => {
      assert.bnEqual(await stakingRewards.rewardPerToken(), ZERO_BN);
    });

    it("should be > 0", async () => {
      const totalToStake = toUnit("100");
      await stakingToken.connect(owner).transfer(stakingAccount1.address, totalToStake);
      await stakingToken.connect(stakingAccount1).approve(stakingRewards.address, totalToStake);
      await stakingRewards.connect(stakingAccount1).stake(totalToStake);

      const totalSupply = await stakingRewards.totalSupply();
      assert.bnGt(totalSupply, ZERO_BN);

      const rewardValue = toUnit("5000.0");
      await rewardsToken.connect(owner).transfer(stakingRewards.address, rewardValue);
      await stakingRewards.connect(rewardsDistribution).notifyRewardAmount(rewardValue);

      await fastForward(DAY);

      const rewardPerToken = await stakingRewards.rewardPerToken();
      assert.bnGt(rewardPerToken, ZERO_BN);
    });
  });

  describe("stake()", () => {
    it("staking increases staking balance", async () => {
      const totalToStake = toUnit("100");
      await stakingToken.connect(owner).transfer(stakingAccount1.address, totalToStake);
      await stakingToken.connect(stakingAccount1).approve(stakingRewards.address, totalToStake);

      const initialStakeBal = await stakingRewards.balanceOf(stakingAccount1.address);
      const initialLpBal = await stakingToken.balanceOf(stakingAccount1.address);

      await stakingRewards.connect(stakingAccount1).stake(totalToStake);

      const postStakeBal = await stakingRewards.balanceOf(stakingAccount1.address);
      const postLpBal = await stakingToken.balanceOf(stakingAccount1.address);

      assert.bnLt(postLpBal, initialLpBal);
      assert.bnGt(postStakeBal, initialStakeBal);
    });

    it("cannot stake 0", async () => {
      await assert.revert(stakingRewards.stake("0"), "Cannot stake 0");
    });
  });

  describe("earned()", () => {
    it("should be 0 when not staking", async () => {
      assert.bnEqual(await stakingRewards.earned(stakingAccount1.address), ZERO_BN);
    });

    it("should be > 0 when staking", async () => {
      const totalToStake = toUnit("100");
      await stakingToken.connect(owner).transfer(stakingAccount1.address, totalToStake);
      await stakingToken.connect(stakingAccount1).approve(stakingRewards.address, totalToStake);
      await stakingRewards.connect(stakingAccount1).stake(totalToStake);

      const rewardValue = toUnit("5000.0");
      await rewardsToken.connect(owner).transfer(stakingRewards.address, rewardValue);
      await stakingRewards.connect(rewardsDistribution).notifyRewardAmount(rewardValue);

      await fastForward(DAY);

      const earned = await stakingRewards.earned(stakingAccount1.address);

      assert.bnGt(earned, ZERO_BN);
    });

    it("rewardRate should increase if new rewards come before DURATION ends", async () => {
      const totalToDistribute = toUnit("5000");

      await rewardsToken.connect(owner).transfer(stakingRewards.address, totalToDistribute);
      await stakingRewards.connect(rewardsDistribution).notifyRewardAmount(totalToDistribute);

      const rewardRateInitial = await stakingRewards.rewardRate();

      await rewardsToken.connect(owner).transfer(stakingRewards.address, totalToDistribute);
      await stakingRewards.connect(rewardsDistribution).notifyRewardAmount(totalToDistribute);

      const rewardRateLater = await stakingRewards.rewardRate();

      assert.bnGt(rewardRateInitial, ZERO_BN);
      assert.bnGt(rewardRateLater, rewardRateInitial);
    });

    it("rewards token balance should rollover after DURATION", async () => {
      const totalToStake = toUnit("100");
      const totalToDistribute = toUnit("5000");

      await stakingToken.connect(owner).transfer(stakingAccount1.address, totalToStake);
      await stakingToken.connect(stakingAccount1).approve(stakingRewards.address, totalToStake);
      await stakingRewards.connect(stakingAccount1).stake(totalToStake);

      await rewardsToken.connect(owner).transfer(stakingRewards.address, totalToDistribute);
      await stakingRewards.connect(rewardsDistribution).notifyRewardAmount(totalToDistribute);

      await fastForward(DAY * 7);
      const earnedFirst = await stakingRewards.earned(stakingAccount1.address);

      await rewardsToken.connect(owner).transfer(stakingRewards.address, totalToDistribute);
      await stakingRewards.connect(rewardsDistribution).notifyRewardAmount(totalToDistribute);

      await fastForward(DAY * 7);
      const earnedSecond = await stakingRewards.earned(stakingAccount1.address);

      assert.bnEqual(earnedSecond, earnedFirst.add(earnedFirst));
    });
  });

  describe("getReward()", () => {
    it("should increase rewards token balance", async () => {
      const totalToStake = toUnit("100");
      const totalToDistribute = toUnit("5000");

      await stakingToken.connect(owner).transfer(stakingAccount1.address, totalToStake);
      await stakingToken.connect(stakingAccount1).approve(stakingRewards.address, totalToStake);
      await stakingRewards.connect(stakingAccount1).stake(totalToStake);

      await rewardsToken.connect(owner).transfer(stakingRewards.address, totalToDistribute);
      await stakingRewards.connect(rewardsDistribution).notifyRewardAmount(totalToDistribute);

      await fastForward(DAY);

      const initialRewardBal = await rewardsToken.balanceOf(stakingAccount1.address);
      const initialEarnedBal = await stakingRewards.earned(stakingAccount1.address);
      await stakingRewards.connect(stakingAccount1).getReward();
      const postRewardBal = await rewardsToken.balanceOf(stakingAccount1.address);
      const postEarnedBal = await stakingRewards.earned(stakingAccount1.address);

      assert.bnLt(postEarnedBal, initialEarnedBal);
      assert.bnGt(postRewardBal, initialRewardBal);
    });
  });

  describe("setRewardsDuration()", () => {
    const sevenDays = DAY * 7;
    const seventyDays = DAY * 70;
    it("should increase rewards duration before starting distribution", async () => {
      const defaultDuration = await stakingRewards.rewardsDuration();
      assert.bnEqual(defaultDuration, sevenDays);

      await stakingRewards.connect(owner).setRewardsDuration(seventyDays);
      const newDuration = await stakingRewards.rewardsDuration();
      assert.bnEqual(newDuration, seventyDays);
    });
    it("should revert when setting setRewardsDuration before the period has finished", async () => {
      const totalToStake = toUnit("100");
      const totalToDistribute = toUnit("5000");

      await stakingToken.connect(owner).transfer(stakingAccount1.address, totalToStake);
      await stakingToken.connect(stakingAccount1).approve(stakingRewards.address, totalToStake);
      await stakingRewards.connect(stakingAccount1).stake(totalToStake);

      await rewardsToken.connect(owner).transfer(stakingRewards.address, totalToDistribute);
      await stakingRewards.connect(rewardsDistribution).notifyRewardAmount(totalToDistribute);

      await fastForward(DAY);

      await assert.revert(
        stakingRewards.connect(owner).setRewardsDuration(seventyDays),
        "Previous rewards period must be complete before changing the duration for the new period"
      );
    });
    it("should update when setting setRewardsDuration after the period has finished", async () => {
      const totalToStake = toUnit("100");
      const totalToDistribute = toUnit("5000");
      await stakingToken.connect(owner).transfer(stakingAccount1.address, totalToStake);
      await stakingToken.connect(stakingAccount1).approve(stakingRewards.address, totalToStake);
      await stakingRewards.connect(stakingAccount1).stake(totalToStake);

      await rewardsToken.connect(owner).transfer(stakingRewards.address, totalToDistribute);
      await stakingRewards.connect(rewardsDistribution).notifyRewardAmount(totalToDistribute);

      await fastForward(DAY * 8);

      const transaction = await stakingRewards.connect(owner).setRewardsDuration(seventyDays);
      const receipt = await transaction.wait();
      const event = receipt.events?.find((e: any) => e.event === "RewardsDurationUpdated");
      assert.eventEqual(event, "RewardsDurationUpdated", {
        newDuration: seventyDays
      });
      const newDuration = await stakingRewards.rewardsDuration();
      assert.bnEqual(newDuration, seventyDays);
      await stakingRewards.connect(rewardsDistribution).notifyRewardAmount(totalToDistribute);
    });

    it("should update when setting setRewardsDuration after the period has finished", async () => {
      const totalToStake = toUnit("100");
      const totalToDistribute = toUnit("5000");

      await stakingToken.connect(owner).transfer(stakingAccount1.address, totalToStake);
      await stakingToken.connect(stakingAccount1).approve(stakingRewards.address, totalToStake);
      await stakingRewards.connect(stakingAccount1).stake(totalToStake);

      await rewardsToken.connect(owner).transfer(stakingRewards.address, totalToDistribute);
      await stakingRewards.connect(rewardsDistribution).notifyRewardAmount(totalToDistribute);

      await fastForward(DAY * 4);
      await stakingRewards.connect(stakingAccount1).getReward();
      await fastForward(DAY * 4);

      // New Rewards period much lower
      await rewardsToken.connect(owner).transfer(stakingRewards.address, totalToDistribute);
      const transaction = await stakingRewards.connect(owner).setRewardsDuration(seventyDays);
      const receipt = await transaction.wait();
      const event = receipt.events?.find((e: any) => e.event === "RewardsDurationUpdated");
      assert.eventEqual(event, "RewardsDurationUpdated", {
        newDuration: seventyDays
      });

      const newDuration = await stakingRewards.rewardsDuration();
      assert.bnEqual(newDuration, seventyDays);

      await stakingRewards.connect(rewardsDistribution).notifyRewardAmount(totalToDistribute);

      await fastForward(DAY * 71);
      await stakingRewards.connect(stakingAccount1).getReward();
    });
  });

  describe("getRewardForDuration()", () => {
    it("should increase rewards token balance", async () => {
      const totalToDistribute = toUnit("5000");
      await rewardsToken.connect(owner).transfer(stakingRewards.address, totalToDistribute);
      await stakingRewards.connect(rewardsDistribution).notifyRewardAmount(totalToDistribute);

      const rewardForDuration = await stakingRewards.getRewardForDuration();

      const duration = await stakingRewards.rewardsDuration();
      const rewardRate = await stakingRewards.rewardRate();

      assert.bnGt(rewardForDuration, ZERO_BN);
      assert.bnEqual(rewardForDuration, duration.mul(rewardRate));
    });
  });

  describe("withdraw()", () => {
    it("cannot withdraw if nothing staked", async () => {
      await assert.revert(
        stakingRewards.withdraw(toUnit("100")),
        "Arithmetic operation underflowed or overflowed outside of an unchecked block"
      );
    });

    it("should increases lp token balance and decreases staking balance", async () => {
      const totalToStake = toUnit("100");
      await stakingToken.connect(owner).transfer(stakingAccount1.address, totalToStake);
      await stakingToken.connect(stakingAccount1).approve(stakingRewards.address, totalToStake);
      await stakingRewards.connect(stakingAccount1).stake(totalToStake);

      const initialStakingTokenBal = await stakingToken.balanceOf(stakingAccount1.address);
      const initialStakeBal = await stakingRewards.balanceOf(stakingAccount1.address);

      await stakingRewards.connect(stakingAccount1).withdraw(totalToStake);

      const postStakingTokenBal = await stakingToken.balanceOf(stakingAccount1.address);
      const postStakeBal = await stakingRewards.balanceOf(stakingAccount1.address);

      assert.bnEqual(postStakeBal.add(totalToStake), initialStakeBal);
      assert.bnEqual(initialStakingTokenBal.add(totalToStake), postStakingTokenBal);
    });

    it("cannot withdraw 0", async () => {
      await assert.revert(stakingRewards.withdraw("0"), "Cannot withdraw 0");
    });
  });

  describe("exit()", () => {
    it("should retrieve all earned and increase rewards bal", async () => {
      const totalToStake = toUnit("100");
      const totalToDistribute = toUnit("5000");

      await stakingToken.connect(owner).transfer(stakingAccount1.address, totalToStake);
      await stakingToken.connect(stakingAccount1).approve(stakingRewards.address, totalToStake);
      await stakingRewards.connect(stakingAccount1).stake(totalToStake);

      await rewardsToken.connect(owner).transfer(stakingRewards.address, totalToDistribute);
      await stakingRewards.connect(rewardsDistribution).notifyRewardAmount(toUnit("5000.0"));

      await fastForward(DAY);

      const initialRewardBal = await rewardsToken.balanceOf(stakingAccount1.address);
      const initialEarnedBal = await stakingRewards.earned(stakingAccount1.address);
      await stakingRewards.connect(stakingAccount1).exit();
      const postRewardBal = await rewardsToken.balanceOf(stakingAccount1.address);
      const postEarnedBal = await stakingRewards.earned(stakingAccount1.address);

      assert.bnLt(postEarnedBal, initialEarnedBal);
      assert.bnGt(postRewardBal, initialRewardBal);
      assert.bnEqual(postEarnedBal, ZERO_BN);
    });
  });

  describe("notifyRewardAmount()", () => {
    let localStakingRewards: any;

    before(async () => {
      const StakingRewardsFactory = (await ethers.getContractFactory("StakingRewards")) as StakingRewards__factory;
      localStakingRewards = (await StakingRewardsFactory.deploy(
        owner.address,
        rewardsDistribution.address,
        rewardsToken.address,
        stakingToken.address
      )) as StakingRewards;
      await localStakingRewards.deployed();
    });

    it("Reverts if the provided reward is greater than the balance.", async () => {
      const rewardValue = toUnit("1000");
      await rewardsToken.connect(owner).transfer(localStakingRewards.address, rewardValue);
      await assert.revert(
        localStakingRewards.connect(rewardsDistribution).notifyRewardAmount(rewardValue.add(toUnit("0.1"))),
        "Provided reward too high"
      );
    });

    it("Reverts if the provided reward is greater than the balance, plus rolled-over balance.", async () => {
      const rewardValue = toUnit("1000");
      await rewardsToken.connect(owner).transfer(localStakingRewards.address, rewardValue);
      localStakingRewards.connect(rewardsDistribution).notifyRewardAmount(rewardValue);
      await rewardsToken.connect(owner).transfer(localStakingRewards.address, rewardValue);
      // Now take into account any leftover quantity.
      await assert.revert(
        localStakingRewards.connect(rewardsDistribution).notifyRewardAmount(rewardValue.add(toUnit("0.1"))),
        "Provided reward too high"
      );
    });
  });

  describe("Integration Tests", () => {
    before(async () => {
      // Set rewardDistribution address
      await stakingRewards.connect(owner).setRewardsDistribution(rewardsDistribution.address);
      assert.equal(await stakingRewards.rewardsDistribution(), rewardsDistribution.address);
    });

    it("stake and claim", async () => {
      // Transfer some LP Tokens to user
      const totalToStake = toUnit("500");
      await stakingToken.connect(owner).transfer(stakingAccount1.address, totalToStake);

      // Stake LP Tokens
      await stakingToken.connect(stakingAccount1).approve(stakingRewards.address, totalToStake);
      await stakingRewards.connect(stakingAccount1).stake(totalToStake);

      // Distribute some rewards
      const totalToDistribute = toUnit("35000");

      // Transfer Rewards to the RewardsDistribution contract address
      await rewardsToken.connect(owner).transfer(rewardsDistribution.address, totalToDistribute);
      await rewardsToken.connect(rewardsDistribution).transfer(stakingRewards.address, totalToDistribute);
      await stakingRewards.connect(rewardsDistribution).notifyRewardAmount(totalToDistribute);

      // Period finish should be ~7 days from now
      const periodFinish = await stakingRewards.periodFinish();
      const curTimestamp = await currentTime();
      assert.equal(parseInt(periodFinish.toString(), 10), curTimestamp + DAY * 7);

      // Reward duration is 7 days, so we'll
      // Fastforward time by 6 days to prevent expiration
      await fastForward(DAY * 6);
      // Reward rate and reward per token
      const rewardRate = await stakingRewards.rewardRate();
      assert.bnGt(rewardRate, ZERO_BN);
      const rewardPerToken = await stakingRewards.rewardPerToken();
      assert.bnGt(rewardPerToken, ZERO_BN);
      // Make sure we earned in proportion to reward per token
      const rewardRewardsEarned = await stakingRewards.earned(stakingAccount1.address);
      assert.bnEqual(rewardRewardsEarned, rewardPerToken.mul(totalToStake).div(toUnit("1")));
      // Make sure after withdrawing, we still have the ~amount of rewardRewards
      // The two values will be a bit different as time has "passed"
      const initialWithdraw = toUnit("100");
      await stakingRewards.connect(stakingAccount1).withdraw(initialWithdraw);
      assert.bnEqual(initialWithdraw, await stakingToken.balanceOf(stakingAccount1.address));
      const rewardRewardsEarnedPostWithdraw = await stakingRewards.earned(stakingAccount1.address);
      assert.bnClose(rewardRewardsEarned, rewardRewardsEarnedPostWithdraw, toUnit("0.1"));
      // Get rewards
      const initialRewardBal = await rewardsToken.balanceOf(stakingAccount1.address);
      await stakingRewards.connect(stakingAccount1).getReward();
      const postRewardRewardBal = await rewardsToken.balanceOf(stakingAccount1.address);
      assert.bnGt(postRewardRewardBal, initialRewardBal);
      // Exit
      const preExitLPBal = await stakingToken.balanceOf(stakingAccount1.address);
      await stakingRewards.connect(stakingAccount1).exit();
      const postExitLPBal = await stakingToken.balanceOf(stakingAccount1.address);
      assert.bnGt(postExitLPBal, preExitLPBal);
    });
  });
});
