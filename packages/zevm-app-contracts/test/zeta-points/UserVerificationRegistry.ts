import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
use(solidity);
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import { UserVerificationRegistry } from "../../typechain-types";

describe("UserVerificationRegistry Contract test", () => {
  let userVerificationRegistry: UserVerificationRegistry, user: SignerWithAddress, addrs: SignerWithAddress[];

  beforeEach(async () => {
    [user, ...addrs] = await ethers.getSigners();
    const UserVerificationRegistryFactory = await ethers.getContractFactory("UserVerificationRegistry");
    //@ts-ignore
    userVerificationRegistry = await UserVerificationRegistryFactory.deploy();
  });

  describe("True", () => {
    it("Should be true", async () => {
      expect(true).to.equal(true);
    });
  });

  describe("Vereification test", () => {
    it("Should be able to verify a wallet", async () => {
      const hasBeenVerified = await userVerificationRegistry.hasBeenVerified(user.address);
      expect(hasBeenVerified).to.be.false;

      const tx = await userVerificationRegistry.markAsVerified();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const hasBeenVerifiedAfter = await userVerificationRegistry.hasBeenVerified(user.address);
      expect(hasBeenVerifiedAfter).to.be.true;

      const verification = await userVerificationRegistry.getVerifiedTimestamp(user.address);
      expect(verification).to.be.eq(block.timestamp);
    });
  });
});
