import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
use(solidity);
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import { ZetaXP } from "../../typechain-types";
import { getSignature, NFT } from "./test.helpers";

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

  describe("NFT test", () => {
    it("Should mint and NFT", async () => {
      const sig = await getSignature(inviter, invitee.address, 1, sampleNFT.data, sampleNFT.tasksId, sampleNFT.tasks);
      await zetaXP.mintNFT(invitee.address, 1, sampleNFT.data, sampleNFT.tasksId, sampleNFT.tasks, sig);

      const owner = await zetaXP.ownerOf(1);
      await expect(owner).to.be.eq(invitee.address);

      const nftData = await zetaXP.data(1);
      await expect(nftData.xpTotal).to.be.eq(sampleNFT.data.xpTotal);
      await expect(nftData.level).to.be.eq(sampleNFT.data.level);
      await expect(nftData.testnetCampaignParticipant).to.be.eq(sampleNFT.data.testnetCampaignParticipant);
      await expect(nftData.enrollDate).to.be.eq(sampleNFT.data.enrollDate);
      await expect(nftData.mintDate).to.be.eq(sampleNFT.data.mintDate);
      await expect(nftData.generation).to.be.eq(sampleNFT.data.generation);

      for (let i = 0; i < sampleNFT.tasksId.length; i++) {
        const sampleTask = sampleNFT.tasks[i];
        const task = await zetaXP.tasks(sampleNFT.tokenId, sampleNFT.tasksId[i]);
        await expect(task.completed).to.be.eq(sampleTask.completed);
        await expect(task.count).to.be.eq(sampleTask.count);
      }

      const url = await zetaXP.tokenURI(1);
      await expect(url).to.be.eq("https://api.zetachain.io/nft/1");
    });
  });
});
