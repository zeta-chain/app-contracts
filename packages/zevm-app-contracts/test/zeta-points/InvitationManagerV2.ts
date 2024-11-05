import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
use(solidity);
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import { InvitationManager, InvitationManagerV2 } from "../../typechain-types";
import { EnrollmentSigned, getEnrollmentSignature } from "./invitationManager.helpers";

const HARDHAT_CHAIN_ID = 1337;

describe("InvitationManagerV2 Contract test", () => {
  let invitationManager: InvitationManager,
    invitationManagerV2: InvitationManagerV2,
    signer: SignerWithAddress,
    user: SignerWithAddress,
    addrs: SignerWithAddress[];

  beforeEach(async () => {
    [signer, user, ...addrs] = await ethers.getSigners();
    const InvitationManager = await ethers.getContractFactory("InvitationManager");
    //@ts-ignore
    invitationManager = await InvitationManager.deploy();

    const InvitationManagerV2 = await ethers.getContractFactory("InvitationManagerV2");
    //@ts-ignore
    invitationManagerV2 = await InvitationManagerV2.deploy(invitationManager.address);
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
    it("Should do enrollment", async () => {
      {
        const hasBeenVerifiedBefore = await invitationManagerV2.hasBeenVerified(user.address);
        await expect(hasBeenVerifiedBefore).to.be.eq(false);
      }

      await invitationManagerV2.connect(user).markAsVerified();

      {
        const hasBeenVerifiedBefore = await invitationManagerV2.hasBeenVerified(user.address);
        await expect(hasBeenVerifiedBefore).to.be.eq(true);
      }
    });

    it("Should execute enrollement with from other", async () => {
      {
        const hasBeenVerifiedBefore = await invitationManagerV2.hasBeenVerified(user.address);
        await expect(hasBeenVerifiedBefore).to.be.eq(false);
      }

      const signatureExpiration = await getTomorrowTimestamp();
      const signature = await getEnrollmentSignature(
        HARDHAT_CHAIN_ID,
        invitationManagerV2.address,
        user,
        signatureExpiration,
        user.address
      );
      const enrollementParams: EnrollmentSigned = {
        signature,
        signatureExpiration,
        to: user.address,
      } as EnrollmentSigned;

      await invitationManagerV2.markAsVerifiedWithSignature(enrollementParams);

      {
        const hasBeenVerifiedBefore = await invitationManagerV2.hasBeenVerified(user.address);
        await expect(hasBeenVerifiedBefore).to.be.eq(true);
      }
    });

    it("Should check if user was enroll in previus version", async () => {
      {
        const hasBeenVerifiedBefore = await invitationManagerV2.hasBeenVerified(user.address);
        await expect(hasBeenVerifiedBefore).to.be.eq(false);
      }

      await invitationManager.connect(user).markAsVerified();

      {
        const hasBeenVerifiedBefore = await invitationManagerV2.hasBeenVerified(user.address);
        await expect(hasBeenVerifiedBefore).to.be.eq(true);
      }
    });

    it("Should fail if try to enroll somebody else", async () => {
      {
        const hasBeenVerifiedBefore = await invitationManagerV2.hasBeenVerified(user.address);
        await expect(hasBeenVerifiedBefore).to.be.eq(false);
      }

      const signatureExpiration = await getTomorrowTimestamp();
      const signature = await getEnrollmentSignature(
        HARDHAT_CHAIN_ID,
        invitationManagerV2.address,
        user,
        signatureExpiration,
        user.address
      );
      const enrollementParams: EnrollmentSigned = {
        signature,
        signatureExpiration,
        to: signer.address,
      } as EnrollmentSigned;

      const tx = invitationManagerV2.markAsVerifiedWithSignature(enrollementParams);
      await expect(tx).to.be.revertedWith("InvalidSigner");
    });

    it("Should fail if try to enroll and was already enrolled", async () => {
      {
        const hasBeenVerifiedBefore = await invitationManagerV2.hasBeenVerified(user.address);
        await expect(hasBeenVerifiedBefore).to.be.eq(false);
      }

      const signatureExpiration = await getTomorrowTimestamp();
      const signature = await getEnrollmentSignature(
        HARDHAT_CHAIN_ID,
        invitationManagerV2.address,
        user,
        signatureExpiration,
        user.address
      );
      const enrollementParams: EnrollmentSigned = {
        signature,
        signatureExpiration,
        to: user.address,
      } as EnrollmentSigned;

      await invitationManagerV2.markAsVerifiedWithSignature(enrollementParams);

      const tx = invitationManagerV2.markAsVerifiedWithSignature(enrollementParams);
      await expect(tx).to.be.revertedWith("UserAlreadyVerified");
    });

    it("Should fail if try to enroll and was enrolled with previus contract", async () => {
      {
        const hasBeenVerifiedBefore = await invitationManagerV2.hasBeenVerified(user.address);
        await expect(hasBeenVerifiedBefore).to.be.eq(false);
      }

      await invitationManager.connect(user).markAsVerified();
      const signatureExpiration = await getTomorrowTimestamp();
      const signature = await getEnrollmentSignature(
        HARDHAT_CHAIN_ID,
        invitationManagerV2.address,
        user,
        signatureExpiration,
        user.address
      );
      const enrollementParams: EnrollmentSigned = {
        signature,
        signatureExpiration,
        to: user.address,
      } as EnrollmentSigned;

      const tx = invitationManagerV2.markAsVerifiedWithSignature(enrollementParams);
      await expect(tx).to.be.revertedWith("UserAlreadyVerified");
    });
  });
});
