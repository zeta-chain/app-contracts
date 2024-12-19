import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { InstantRewardsFactory, InstantRewardsV2 } from "../../typechain-types";

describe("Instant Rewards Contract test", () => {
  let instantRewardsFactory: InstantRewardsFactory,
    deployer: SignerWithAddress,
    owner: SignerWithAddress,
    signer: SignerWithAddress,
    user: SignerWithAddress,
    addrs: SignerWithAddress[];

  beforeEach(async () => {
    [deployer, owner, signer, user, ...addrs] = await ethers.getSigners();
    const instantRewardsFactoryF = await ethers.getContractFactory("InstantRewardsFactory");
    instantRewardsFactory = (await instantRewardsFactoryF.deploy(owner.address)) as InstantRewardsFactory;
    await instantRewardsFactory.deployed();
  });

  it("Should deploy an IR instance", async () => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const start = currentBlock.timestamp + 1000;
    const end = start + 1000;
    const name = "Instant Rewards";
    const tx = instantRewardsFactory
      .connect(owner)
      .createInstantRewards(signer.address, start, end, name, "http://img.com", "http://avatar.com", "Description");
    await expect(tx).to.emit(instantRewardsFactory, "InstantRewardsCreated");

    const events = await instantRewardsFactory.queryFilter("InstantRewardsCreated");
    const address = events[0].args?.instantRewards;
    expect(address).to.be.not.undefined;

    const instantRewards = (await ethers.getContractAt("InstantRewardsV2", address)) as InstantRewardsV2;
    expect(await instantRewards.signerAddress()).to.be.eq(signer.address);
    expect(await instantRewards.start()).to.be.eq(start);
    expect(await instantRewards.end()).to.be.eq(end);
    expect(await instantRewards.name()).to.be.eq(name);

    await instantRewards.connect(owner).acceptOwnership();
    expect(await instantRewards.owner()).to.be.eq(owner.address);
  });

  it("Should revert if not owner try to deploy", async () => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const start = currentBlock.timestamp + 1000;
    const end = start + 1000;
    const name = "Instant Rewards";
    const tx = instantRewardsFactory.createInstantRewards(
      signer.address,
      start,
      end,
      name,
      "http://img.com",
      "http://avatar.com",
      "Description"
    );
    await expect(tx).to.revertedWith("AccessDenied");
  });

  it("Should deploy an IR instance with any wallet if it's open", async () => {
    await instantRewardsFactory.connect(owner).setAllowPublicCreation(true);

    const currentBlock = await ethers.provider.getBlock("latest");
    const start = currentBlock.timestamp + 1000;
    const end = start + 1000;
    const name = "Instant Rewards";
    const tx = instantRewardsFactory.createInstantRewards(
      signer.address,
      start,
      end,
      name,
      "http://img.com",
      "http://avatar.com",
      "Description"
    );
    await expect(tx).to.emit(instantRewardsFactory, "InstantRewardsCreated");
  });
});
