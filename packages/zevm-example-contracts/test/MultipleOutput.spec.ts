import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getAddress as getAddressLib } from "@zetachain/addresses";
import { expect } from "chai";
import { ethers, network } from "hardhat";

import { getMultiOutputForTest } from "../scripts/zeta-swap/helpers";
import { TestSystemContract, TestZRC20, ZetaMultiOutput, ZetaMultiOutput__factory } from "../typechain-types";
import { evmSetup } from "./test.helpers";

describe("ZetaSwap tests", () => {
  let zetaMultiOutputContract: ZetaMultiOutput;
  let ZRC20Contracts: TestZRC20[];
  let systemContract: TestSystemContract;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;

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

    const evmSetupResult = await evmSetup(wGasToken, uniswapFactoryAddr, uniswapRouterAddr);
    ZRC20Contracts = evmSetupResult.ZRC20Contracts;
    systemContract = evmSetupResult.systemContract;

    const Factory = (await ethers.getContractFactory("ZetaMultiOutput")) as ZetaMultiOutput__factory;
    zetaMultiOutputContract = (await Factory.deploy(systemContract.address)) as ZetaMultiOutput;
    await zetaMultiOutputContract.deployed();

    zetaMultiOutputContract.registerDestinationToken(ZRC20Contracts[0].address);
    zetaMultiOutputContract.registerDestinationToken(ZRC20Contracts[1].address);
    zetaMultiOutputContract.registerDestinationToken(ZRC20Contracts[2].address);
  });

  describe("ZetaMultiOutput", () => {
    it("Should do transfers", async () => {
      const initBalanceToken0 = await ZRC20Contracts[0].balanceOf(deployer.address);
      const initBalanceToken1 = await ZRC20Contracts[1].balanceOf(deployer.address);
      const initBalanceToken2 = await ZRC20Contracts[2].balanceOf(deployer.address);

      const amount = parseUnits("10");
      await ZRC20Contracts[0].transfer(systemContract.address, amount);

      const params = getMultiOutputForTest(deployer.address);
      await systemContract.onCrossChainCall(zetaMultiOutputContract.address, ZRC20Contracts[0].address, amount, params);

      const endBalanceToken0 = await ZRC20Contracts[0].balanceOf(deployer.address);
      const endBalanceToken1 = await ZRC20Contracts[1].balanceOf(deployer.address);
      const endBalanceToken2 = await ZRC20Contracts[2].balanceOf(deployer.address);

      expect(endBalanceToken0).to.be.eq(initBalanceToken0.sub(amount));
      expect(endBalanceToken1).to.be.gt(initBalanceToken1);
      expect(endBalanceToken2).to.be.gt(initBalanceToken2);
    });

    it("Should throw error if no owner try to register chain", async () => {
      const zetaMultiOutputContractOtherUser = zetaMultiOutputContract.connect(accounts[1]);
      await expect(zetaMultiOutputContractOtherUser.registerDestinationToken(ZRC20Contracts[2].address)).to.be.reverted;
    });

    it("Should throw error if there's no destination registered", async () => {
      const Factory = (await ethers.getContractFactory("ZetaMultiOutput")) as ZetaMultiOutput__factory;
      zetaMultiOutputContract = (await Factory.deploy(systemContract.address)) as ZetaMultiOutput;
      await zetaMultiOutputContract.deployed();

      const amount = parseUnits("10");
      await ZRC20Contracts[0].transfer(systemContract.address, amount);

      const params = getMultiOutputForTest(deployer.address);
      await expect(
        systemContract.onCrossChainCall(zetaMultiOutputContract.address, ZRC20Contracts[0].address, amount, params)
      ).to.be.revertedWith("NoAvailableTransfers");
    });

    it("Should throw error if there's no transfer to do", async () => {
      const Factory = (await ethers.getContractFactory("ZetaMultiOutput")) as ZetaMultiOutput__factory;
      zetaMultiOutputContract = (await Factory.deploy(systemContract.address)) as ZetaMultiOutput;
      await zetaMultiOutputContract.deployed();
      zetaMultiOutputContract.registerDestinationToken(ZRC20Contracts[0].address);

      const amount = parseUnits("10");
      await ZRC20Contracts[0].transfer(systemContract.address, amount);

      const params = getMultiOutputForTest(deployer.address);
      await expect(
        systemContract.onCrossChainCall(zetaMultiOutputContract.address, ZRC20Contracts[0].address, amount, params)
      ).to.be.revertedWith("NoAvailableTransfers");
    });
  });
});
