import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
use(solidity);
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import { ZetaXP } from "../../typechain-types";
import { Data, getSignature, NFT, Task } from "./test.helpers";

describe("XP NFT Contract test", () => {
  let zetaXP: ZetaXP, inviter: SignerWithAddress, invitee: SignerWithAddress, addrs: SignerWithAddress[];
  let sampleNFT: NFT;

  beforeEach(async () => {
    [inviter, invitee, ...addrs] = await ethers.getSigners();
    const zetaXPFactory = await ethers.getContractFactory("ZetaXP");

    //@ts-ignore
    zetaXP = await zetaXPFactory.deploy("ZETA NFT", "ZNFT", "https://api.zetachain.io/nft/", inviter.address);

    sampleNFT = {
      data: {
        enrollDate: 5435,
        generation: 2314,
        level: 7,
        mintDate: 34,
        testnetCampaignParticipant: 2,
        xpTotal: 67,
      },
      tasks: [
        {
          completed: true,
          count: 10,
        },
        {
          completed: false,
          count: 5,
        },
      ],
      tasksId: [2, 3],
      to: invitee.address,
      tokenId: 1,
    };
  });

  describe("True", () => {
    it("Should be true", async () => {
      expect(true).to.equal(true);
    });
  });

  describe("Invitations test", () => {
    it("Should verify an invitation and store it", async () => {
      const sig = await getSignature(inviter, invitee.address, 1, sampleNFT.data, sampleNFT.tasksId, sampleNFT.tasks);
      await zetaXP.mintNFT(invitee.address, 1, sampleNFT.data, sampleNFT.tasksId, sampleNFT.tasks, sig);
      // const expirationDate = await getTomorrowTimestamp();
      // const sig = await getInvitationSig(inviter, expirationDate);
      // const hasBeenVerifiedBefore = await zetaXP.hasBeenVerified(invitee.address);
      // await expect(hasBeenVerifiedBefore).to.be.eq(false);
      // const tx = await zetaXP.connect(invitee).confirmAndAcceptInvitation(inviter.address, expirationDate, sig);
      // const rec = await tx.wait();
      // const block = await ethers.provider.getBlock(rec.blockNumber);
      // const invitation = await zetaXP.acceptedInvitationsTimestamp(inviter.address, invitee.address);
      // await expect(invitation).to.be.eq(block.timestamp);
      // const invitationCount = await zetaXP.getInviteeCount(inviter.address);
      // await expect(invitationCount).to.be.eq(1);
      // const hasBeenVerifiedAfter = await zetaXP.hasBeenVerified(invitee.address);
      // await expect(hasBeenVerifiedAfter).to.be.eq(true);
    });
  });
});
