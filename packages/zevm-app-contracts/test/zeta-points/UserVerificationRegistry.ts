import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
use(solidity);
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import { InvitationManager } from "../../typechain-types";

describe("UserVerificationRegistry Contract test", () => {
  let invitationManager: InvitationManager, user: SignerWithAddress, addrs: SignerWithAddress[];

  beforeEach(async () => {
    [user, ...addrs] = await ethers.getSigners();
    const InvitationManagerFactory = await ethers.getContractFactory("InvitationManager");
    //@ts-ignore
    invitationManager = await InvitationManagerFactory.deploy();
  });

  describe("True", () => {
    it("Should be true", async () => {
      expect(true).to.equal(true);
    });
  });

  describe("Vereification test", () => {
    it("Should be able to verify a wallet", async () => {
      const hasBeenVerified = await invitationManager.hasBeenVerified(user.address);
      expect(hasBeenVerified).to.be.false;

      const tx = await invitationManager.markAsVerified();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const hasBeenVerifiedAfter = await invitationManager.hasBeenVerified(user.address);
      expect(hasBeenVerifiedAfter).to.be.true;

      const verification = await invitationManager.getVerifiedTimestamp(user.address);
      expect(verification).to.be.eq(block.timestamp);
    });
  });
});
