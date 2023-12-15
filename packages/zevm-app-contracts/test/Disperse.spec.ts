import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, network } from "hardhat";

import { Disperse, Disperse__factory, MockZRC20, MockZRC20__factory } from "../typechain-types";

describe("Disperse tests", () => {
  let disperseContract: Disperse;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;

  beforeEach(async () => {
    [deployer, ...accounts] = await ethers.getSigners();

    await network.provider.send("hardhat_setBalance", [deployer.address, parseUnits("1000000").toHexString()]);

    const DisperseFactory = (await ethers.getContractFactory("Disperse")) as Disperse__factory;
    disperseContract = (await DisperseFactory.deploy()) as Disperse;
    await disperseContract.deployed();
  });

  describe("Disperse", () => {
    it("Should disperse ETH", async () => {
      const amount = parseUnits("10");
      const balance0 = await ethers.provider.getBalance(accounts[0].address);
      const balance1 = await ethers.provider.getBalance(accounts[1].address);
      await disperseContract.disperseEther([accounts[0].address, accounts[1].address], [amount, amount.mul(2)], {
        value: amount.mul(3),
      });

      const balance0After = await ethers.provider.getBalance(accounts[0].address);
      const balance1After = await ethers.provider.getBalance(accounts[1].address);

      expect(balance0After.sub(balance0)).to.be.eq(amount);
      expect(balance1After.sub(balance1)).to.be.eq(amount.mul(2));
    });

    it("Should disperse ETH with surplus", async () => {
      const amount = parseUnits("10");
      const balance0 = await ethers.provider.getBalance(accounts[0].address);
      const balance1 = await ethers.provider.getBalance(accounts[1].address);
      await disperseContract.disperseEther([accounts[0].address, accounts[1].address], [amount, amount.mul(2)], {
        value: amount.mul(4),
      });

      const balance0After = await ethers.provider.getBalance(accounts[0].address);
      const balance1After = await ethers.provider.getBalance(accounts[1].address);

      expect(balance0After.sub(balance0)).to.be.eq(amount);
      expect(balance1After.sub(balance1)).to.be.eq(amount.mul(2));
    });

    it("Should disperse token", async () => {
      const MockTokenFactory = (await ethers.getContractFactory("MockZRC20")) as MockZRC20__factory;
      const mockTokenContract = (await MockTokenFactory.deploy(1_000_000, "MOCK", "MOCK")) as MockZRC20;
      await mockTokenContract.deployed();
      await mockTokenContract.approve(disperseContract.address, parseUnits("1000000"));

      const amount = parseUnits("10");
      const balance0 = await mockTokenContract.balanceOf(accounts[0].address);
      const balance1 = await mockTokenContract.balanceOf(accounts[1].address);
      await disperseContract.disperseToken(
        mockTokenContract.address,
        [accounts[0].address, accounts[1].address],
        [amount, amount.mul(2)]
      );

      const balance0After = await mockTokenContract.balanceOf(accounts[0].address);
      const balance1After = await mockTokenContract.balanceOf(accounts[1].address);

      expect(balance0After.sub(balance0)).to.be.eq(amount);
      expect(balance1After.sub(balance1)).to.be.eq(amount.mul(2));
    });

    it("Should disperse token simple", async () => {
      const MockTokenFactory = (await ethers.getContractFactory("MockZRC20")) as MockZRC20__factory;
      const mockTokenContract = (await MockTokenFactory.deploy(1_000_000, "MOCK", "MOCK")) as MockZRC20;
      await mockTokenContract.deployed();
      await mockTokenContract.approve(disperseContract.address, parseUnits("1000000"));

      const amount = parseUnits("10");
      const balance0 = await mockTokenContract.balanceOf(accounts[0].address);
      const balance1 = await mockTokenContract.balanceOf(accounts[1].address);
      await disperseContract.disperseTokenSimple(
        mockTokenContract.address,
        [accounts[0].address, accounts[1].address],
        [amount, amount.mul(2)]
      );

      const balance0After = await mockTokenContract.balanceOf(accounts[0].address);
      const balance1After = await mockTokenContract.balanceOf(accounts[1].address);

      expect(balance0After.sub(balance0)).to.be.eq(amount);
      expect(balance1After.sub(balance1)).to.be.eq(amount.mul(2));
    });
  });
});
