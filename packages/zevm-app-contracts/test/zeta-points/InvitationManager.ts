import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
use(solidity);
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import type { InvitationManager } from "../../typechain-types";
import { getInvitationSig } from "./test.helpers";

describe("InvitationManager Contract test", () => {
  let invitationManager: InvitationManager, inviter: SignerWithAddress, invitee: SignerWithAddress, addrs: SignerWithAddress[];

  beforeEach(async () => {
    [inviter, invitee, ...addrs] = await ethers.getSigners();
    const InvitationManager = await ethers.getContractFactory("InvitationManager");
    //@ts-ignore
    invitationManager = await InvitationManager.deploy();
  });

  describe("True", () => {
    it("Should be true", async () => {
      expect(true).to.equal(true);
    });
  });

  describe("Invitations test", () => {
    it("Should verify an invitation and store it", async () => {
      const sig = await getInvitationSig(inviter, invitee.address);
      const tx = await invitationManager.connect(invitee).confirmAndAcceptInvitation(inviter.address, sig);
      const rec = await tx.wait();

      const block = await ethers.provider.getBlock(rec.blockNumber);

      const invitation = await invitationManager.acceptedInvitationsTimestamp(inviter.address, invitee.address);
      await expect(invitation).to.be.eq(block.timestamp);
    });

    it("Should revert if invitation is invalid", async () => {
      const sig = await getInvitationSig(inviter, addrs[0].address);
      const tx = invitationManager.connect(invitee).confirmAndAcceptInvitation(inviter.address, sig);
      await expect(tx).to.be.revertedWith("UnrecognizedInvitation");
    });
  });
});
