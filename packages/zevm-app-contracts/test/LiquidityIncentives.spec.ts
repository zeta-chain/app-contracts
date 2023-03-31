import { BigNumber } from "@ethersproject/bignumber";
import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getAddress as getAddressLib } from "@zetachain/addresses";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import {
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
const ERROR_TOLERANCE = parseEther("0.01");

describe("LiquidityIncentives tests", () => {
  let ZETA: IWETH;
  let ZRC20Contracts: TestZRC20[];
  let systemContract: TestSystemContract;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;

  let rewardDistributorFactory: RewardDistributorFactory;
  let rewardDistributorContract: RewardDistributor;

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
    await ZETA.deposit({ value: parseEther("1000") });

    const evmSetupResult = await evmSetup(wGasToken, uniswapFactoryAddr, uniswapRouterAddr);
    ZRC20Contracts = evmSetupResult.ZRC20Contracts;
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
      ZRC20Contracts[0].address
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
        ZRC20Contracts[0].address
      );
      const receipt = await tx.wait();

      const event = receipt.events?.find(e => e.event === "RewardDistributorCreated");
      expect(event).to.not.be.undefined;

      const { stakingToken, LPStakingToken, rewardToken, owner } = event?.args as any;
      expect(stakingToken).to.be.eq(ZRC20Contracts[0].address);
      const LPTokenAddress = await systemContract.uniswapv2PairFor(
        uniswapv2FactoryAddress,
        ZRC20Contracts[0].address,
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
    tx = await ZRC20Contracts[0].transfer(sampleAccount.address, stakedAmount);

    tx = await ZRC20Contracts[0].connect(sampleAccount).approve(rewardDistributorContract.address, stakedAmount);

    tx = await rewardDistributorContract.addLiquidityAndStake(ZRC20Contracts[0].address, stakedAmount);

    await network.provider.send("evm_increaseTime", [REWARD_DURATION.div(2).toNumber()]);
    await network.provider.send("evm_mine");

    const earned = await rewardDistributorContract.earned(sampleAccount.address);
    expect(earned).to.be.closeTo(REWARDS_AMOUNT.div(2), ERROR_TOLERANCE);
  });
});
