import { BigNumber } from "@ethersproject/bignumber";
import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getAddress as getAddressLib } from "@zetachain/addresses";
import { expect } from "chai";
import { ethers, network } from "hardhat";

import {
  ERC20,
  RewardDistributor,
  RewardDistributorFactory,
  RewardDistributorFactory__factory,
  TestSystemContract,
  TestZRC20
} from "../typechain-types";
import { evmSetup } from "./test.helpers";

describe("LiquidityIncentives tests", () => {
  let USDC: ERC20;
  let ZETA: ERC20;
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

    const USDCAddress = getAddressLib({
      address: "usdc",
      networkName: "eth-mainnet",
      zetaNetwork: "mainnet"
    });

    USDC = (await ethers.getContractAt("ERC20", USDCAddress)) as ERC20;
    ZETA = (await ethers.getContractAt("ERC20", wGasToken)) as ERC20;

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

    const { rewardDistributorContract: rewardDistributorContract_ } = event?.args as any;
    rewardDistributorContract = rewardDistributorContract_;
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
});
