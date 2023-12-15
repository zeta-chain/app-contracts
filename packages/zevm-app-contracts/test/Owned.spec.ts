import { BigNumber } from "@ethersproject/bignumber";
import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, network } from "hardhat";

import { Owned, Owned__factory } from "../typechain-types";

describe("Disperse tests", () => {
  let ownedContract: Owned;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;

  beforeEach(async () => {
    [deployer, ...accounts] = await ethers.getSigners();

    await network.provider.send("hardhat_setBalance", [deployer.address, parseUnits("1000000").toHexString()]);

    const OwnedFactory = (await ethers.getContractFactory("Owned")) as Owned__factory;
    ownedContract = (await OwnedFactory.deploy(deployer.address)) as Owned;
    await ownedContract.deployed();
  });

  describe("Owned", () => {
    it("Should nominate and transfer", async () => {
      let owner = await ownedContract.owner();
      expect(owner).to.be.eq(deployer.address);

      await ownedContract.nominateNewOwner(accounts[1].address);
      owner = await ownedContract.owner();
      expect(owner).to.be.eq(deployer.address);

      await ownedContract.connect(accounts[1]).acceptOwnership();

      owner = await ownedContract.owner();
      expect(owner).to.be.eq(accounts[1].address);
    });
  });
});
