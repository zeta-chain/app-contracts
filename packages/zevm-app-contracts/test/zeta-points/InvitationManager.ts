import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
use(solidity);
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import { InvitationManager } from "../../typechain-types";
import { getInvitationSig } from "./test.helpers";

describe("InvitationManager Contract test", () => {
  let invitationManager: InvitationManager,
    inviter: SignerWithAddress,
    invitee: SignerWithAddress,
    addrs: SignerWithAddress[];

  beforeEach(async () => {
    [inviter, invitee, ...addrs] = await ethers.getSigners();
    const InvitationManager = await ethers.getContractFactory("InvitationManager");
    //@ts-ignore
    invitationManager = await InvitationManager.deploy();
    await invitationManager.markAsVerified();
  });

  describe("True", () => {
    it("Should be true", async () => {
      expect(true).to.equal(true);
    });
  });

  describe("Invitations test", () => {
    it("Should verify an invitation and store it", async () => {
      const sig = await getInvitationSig(inviter);

      const hasBeenVerifiedBefore = await invitationManager.hasBeenVerified(invitee.address);
      await expect(hasBeenVerifiedBefore).to.be.eq(false);

      const tx = await invitationManager.connect(invitee).confirmAndAcceptInvitation(inviter.address, sig);
      const rec = await tx.wait();

      const block = await ethers.provider.getBlock(rec.blockNumber);

      const invitation = await invitationManager.acceptedInvitationsTimestamp(inviter.address, invitee.address);
      await expect(invitation).to.be.eq(block.timestamp);

      const invitationCount = await invitationManager.getInviteeCount(inviter.address);
      await expect(invitationCount).to.be.eq(1);

      const hasBeenVerifiedAfter = await invitationManager.hasBeenVerified(invitee.address);
      await expect(hasBeenVerifiedAfter).to.be.eq(true);
    });

    it("Should revert if invitation is invalid", async () => {
      const sig = await getInvitationSig(inviter);
      const tx = invitationManager.connect(invitee).confirmAndAcceptInvitation(addrs[0].address, sig);
      await expect(tx).to.be.revertedWith("UnrecognizedInvitation");
    });

    it("Should revert if inviter has not been verified", async () => {
      const sig = await getInvitationSig(addrs[0]);
      const tx = invitationManager.connect(invitee).confirmAndAcceptInvitation(addrs[0].address, sig);
      await expect(tx).to.be.revertedWith("UnrecognizedInvitation");
    });

    it("Should revert if invitation is already accepted", async () => {
      const sig = await getInvitationSig(inviter);
      await invitationManager.connect(invitee).confirmAndAcceptInvitation(inviter.address, sig);
      const tx = invitationManager.connect(invitee).confirmAndAcceptInvitation(inviter.address, sig);
      await expect(tx).to.be.revertedWith("UserAlreadyVerified");
    });

    it("Should count only for today if I just accepted", async () => {
      const sig = await getInvitationSig(inviter);
      const tx = await invitationManager.connect(invitee).confirmAndAcceptInvitation(inviter.address, sig);
      const rec = await tx.wait();

      const block = await ethers.provider.getBlock(rec.blockNumber);

      const invitation = await invitationManager.acceptedInvitationsTimestamp(inviter.address, invitee.address);
      await expect(invitation).to.be.eq(block.timestamp);

      const invitationCount = await invitationManager.getInviteeCount(inviter.address);
      await expect(invitationCount).to.be.eq(1);

      const now = block.timestamp;
      const todayTimestamp = Math.floor(now / 86400) * 86400;
      const invitationCountToday = await invitationManager.getTotalInvitesOnDay(todayTimestamp);
      await expect(invitationCountToday).to.be.eq(1);

      const invitationByInviterCountToday = await invitationManager.getInvitesByInviterOnDay(
        inviter.address,
        todayTimestamp
      );
      await expect(invitationByInviterCountToday).to.be.eq(1);

      const yesterdayTimestamp = todayTimestamp - 24 * 60 * 60;
      const invitationCountYesterday = await invitationManager.getTotalInvitesOnDay(yesterdayTimestamp);
      await expect(invitationCountYesterday).to.be.eq(0);

      const invitationByInviterCountYesterday = await invitationManager.getInvitesByInviterOnDay(
        inviter.address,
        yesterdayTimestamp
      );
      await expect(invitationByInviterCountYesterday).to.be.eq(0);
    });
  });
});
