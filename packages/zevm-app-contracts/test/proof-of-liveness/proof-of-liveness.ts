import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, utils } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import { ProofOfLiveness } from "../../typechain-types";

const HARDHAT_CHAIN_ID = 1337;

describe("Proof Of Liveness Contract test", () => {
  let proofOfLiveness: ProofOfLiveness,
    owner: SignerWithAddress,
    signer: SignerWithAddress,
    user: SignerWithAddress,
    addrs: SignerWithAddress[];

  beforeEach(async () => {
    [owner, signer, user, ...addrs] = await ethers.getSigners();
    const ProofOfLivenessFactory = await ethers.getContractFactory("ProofOfLiveness");

    proofOfLiveness = await ProofOfLivenessFactory.deploy();

    await proofOfLiveness.deployed();
  });

  it("Should proof", async () => {
    const tx = await proofOfLiveness.proveLiveness();

    const receipt = await tx.wait();
    const blockTimestamp = (await ethers.provider.getBlock(receipt.blockNumber)).timestamp;

    await expect(tx).to.emit(proofOfLiveness, "LivenessProved").withArgs(owner.address, blockTimestamp);
  });

  it("Should proof 5 times every 24 hours and return correct view values", async () => {
    const PROOF_PERIOD = 24 * 60 * 60; // 24 hours in seconds

    // Prove liveness 5 times
    for (let i = 0; i < 5; i++) {
      // Call the proveLiveness function
      const tx = await proofOfLiveness.proveLiveness();
      await tx.wait();

      // Increase the time by 24 hours in the EVM
      await ethers.provider.send("evm_increaseTime", [PROOF_PERIOD]);
      await ethers.provider.send("evm_mine", []); // Mine a new block to apply the time change
    }

    // Now check the getLastPeriodsStatus for the owner
    const periodsStatus = await proofOfLiveness.getLastPeriodsStatus(owner.address);

    // We expect that all 5 periods should return true
    expect(periodsStatus).to.deep.equal([true, true, true, true, true]);
  });

  it("Should proof 5 times every 24 hours and return correct view values if one day is missing", async () => {
    const PROOF_PERIOD = 24 * 60 * 60; // 24 hours in seconds

    // Prove liveness 5 times
    for (let i = 0; i < 5; i++) {
      // Call the proveLiveness function if day is not 3
      if (i !== 3) {
        const tx = await proofOfLiveness.proveLiveness();
        await tx.wait();
      }

      // Increase the time by 24 hours in the EVM
      await ethers.provider.send("evm_increaseTime", [PROOF_PERIOD]);
      await ethers.provider.send("evm_mine", []); // Mine a new block to apply the time change
    }

    // Now check the getLastPeriodsStatus for the owner
    const periodsStatus = await proofOfLiveness.getLastPeriodsStatus(owner.address);

    // We expect that all 5 periods should return true but 3
    expect(periodsStatus).to.deep.equal([true, false, true, true, true]);
  });

  it("Should proof view return if only one day was proof", async () => {
    const tx = await proofOfLiveness.proveLiveness();
    await tx.wait();
    await ethers.provider.send("evm_mine", []); // Mine a new block to apply the time change

    // Now check the getLastPeriodsStatus for the owner
    const periodsStatus = await proofOfLiveness.getLastPeriodsStatus(owner.address);

    expect(periodsStatus).to.deep.equal([true, false, false, false, false]);
  });

  it("Should revert if trying to prove twice in less than 24 hours", async () => {
    // Prove liveness for the first time
    await proofOfLiveness.proveLiveness();

    const tx = proofOfLiveness.proveLiveness();

    await expect(tx).to.be.revertedWith("ProofWithinLast24Hours");
  });
});
