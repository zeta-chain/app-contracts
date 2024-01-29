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

  const getTomorrowTimestamp = async () => {
    const block = await ethers.provider.getBlock("latest");
    const now = block.timestamp;
    const tomorrow = now + 24 * 60 * 60;
    return tomorrow;
  };

  describe("True", () => {
    it("Should be true", async () => {
      expect(true).to.equal(true);
    });
  });

  describe("Invitations test", () => {
    it("Should verify an invitation and store it", async () => {
      const expirationDate = await getTomorrowTimestamp();

      const sig = await getInvitationSig(inviter, expirationDate);

      const hasBeenVerifiedBefore = await invitationManager.hasBeenVerified(invitee.address);
      await expect(hasBeenVerifiedBefore).to.be.eq(false);

      const tx = await invitationManager
        .connect(invitee)
        .confirmAndAcceptInvitation(inviter.address, expirationDate, sig);
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
      const expirationDate = await getTomorrowTimestamp();
      const sig = await getInvitationSig(inviter, expirationDate);
      const tx = invitationManager.connect(invitee).confirmAndAcceptInvitation(addrs[0].address, expirationDate, sig);
      await expect(tx).to.be.revertedWith("UnrecognizedInvitation");
    });

    it("Should revert if invitation is expired", async () => {
      const expirationDate = await getTomorrowTimestamp();
      const yesterdayTimestamp = expirationDate - 24 * 60 * 60;
      const sig = await getInvitationSig(inviter, expirationDate);
      const tx = invitationManager
        .connect(invitee)
        .confirmAndAcceptInvitation(inviter.address, yesterdayTimestamp, sig);
      await expect(tx).to.be.revertedWith("UnrecognizedInvitation");
    });

    it("Should revert if inviter has not been verified", async () => {
      const expirationDate = await getTomorrowTimestamp();
      const sig = await getInvitationSig(addrs[0], expirationDate);
      const tx = invitationManager.connect(invitee).confirmAndAcceptInvitation(addrs[0].address, expirationDate, sig);
      await expect(tx).to.be.revertedWith("UnrecognizedInvitation");
    });

    it("Should revert if invitation is already accepted", async () => {
      const expirationDate = await getTomorrowTimestamp();
      const sig = await getInvitationSig(inviter, expirationDate);
      await invitationManager.connect(invitee).confirmAndAcceptInvitation(inviter.address, expirationDate, sig);
      const tx = invitationManager.connect(invitee).confirmAndAcceptInvitation(inviter.address, expirationDate, sig);
      await expect(tx).to.be.revertedWith("UserAlreadyVerified");
    });

    it("Should count only for today if I just accepted", async () => {
      const expirationDate = await getTomorrowTimestamp();
      const sig = await getInvitationSig(inviter, expirationDate);
      const tx = await invitationManager
        .connect(invitee)
        .confirmAndAcceptInvitation(inviter.address, expirationDate, sig);
      const rec = await tx.wait();

      const block = await ethers.provider.getBlock(rec.blockNumber);
      const now = block.timestamp;

      const invitation = await invitationManager.acceptedInvitationsTimestamp(inviter.address, invitee.address);
      await expect(invitation).to.be.eq(block.timestamp);

      const invitationCount = await invitationManager.getInviteeCount(inviter.address);
      await expect(invitationCount).to.be.eq(1);

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

    it("Should emit the right event when invitation is accepted", async () => {
      const expirationDate = await getTomorrowTimestamp();
      const sig = await getInvitationSig(inviter, expirationDate);

      const hasBeenVerifiedBefore = await invitationManager.hasBeenVerified(invitee.address);
      await expect(hasBeenVerifiedBefore).to.be.eq(false);

      const tx = await invitationManager
        .connect(invitee)
        .confirmAndAcceptInvitation(inviter.address, expirationDate, sig);
      const rec = await tx.wait();
      const event = rec.events?.find((e) => e.event === "InvitationAccepted");
      const block = await ethers.provider.getBlock(rec.blockNumber);

      expect(event?.args?.inviter).to.be.eq(inviter.address);
      expect(event?.args?.invitee).to.be.eq(invitee.address);
      expect(event?.args?.index).to.be.eq(0);
      expect(event?.args?.acceptedAt).to.be.eq(block.timestamp);
      const inviteeByIndex = await invitationManager.getInviteeAtIndex(inviter.address, event?.args?.index);
      expect(inviteeByIndex).to.be.eq(invitee.address);

      const tx2 = await invitationManager
        .connect(addrs[0])
        .confirmAndAcceptInvitation(inviter.address, expirationDate, sig);
      const rec2 = await tx2.wait();
      const event2 = rec2.events?.find((e) => e.event === "InvitationAccepted");
      const block2 = await ethers.provider.getBlock(rec2.blockNumber);

      await expect(event2?.args?.inviter).to.be.eq(inviter.address);
      await expect(event2?.args?.invitee).to.be.eq(addrs[0].address);
      await expect(event2?.args?.index).to.be.eq(1);
      await expect(event2?.args?.acceptedAt).to.be.eq(block2.timestamp);
      const inviteeByIndex2 = await invitationManager.getInviteeAtIndex(inviter.address, event2?.args?.index);
      expect(inviteeByIndex2).to.be.eq(addrs[0].address);
    });
  });
});
