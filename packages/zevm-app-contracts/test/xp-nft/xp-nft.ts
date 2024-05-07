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

  const validateNFT = async (nft: NFT) => {
    const owner = await zetaXP.ownerOf(nft.tokenId);
    await expect(owner).to.be.eq(nft.to);

    const nftData = await zetaXP.data(nft.tokenId);
    await expect(nftData.xpTotal).to.be.eq(nft.data.xpTotal);
    await expect(nftData.level).to.be.eq(nft.data.level);
    await expect(nftData.testnetCampaignParticipant).to.be.eq(nft.data.testnetCampaignParticipant);
    await expect(nftData.enrollDate).to.be.eq(nft.data.enrollDate);
    await expect(nftData.mintDate).to.be.eq(nft.data.mintDate);
    await expect(nftData.generation).to.be.eq(nft.data.generation);

    for (let i = 0; i < nft.tasksId.length; i++) {
      const sampleTask = nft.tasks[i];
      const task = await zetaXP.tasks(nft.tokenId, nft.tasksId[i]);
      await expect(task.completed).to.be.eq(sampleTask.completed);
      await expect(task.count).to.be.eq(sampleTask.count);
    }

    const url = await zetaXP.tokenURI(nft.tokenId);
    await expect(url).to.be.eq(`https://api.zetachain.io/nft/${nft.tokenId}`);
  };

  describe("NFT test", () => {
    it("Should mint an NFT", async () => {
      const sig = await getSignature(inviter, invitee.address, 1, sampleNFT.data, sampleNFT.tasksId, sampleNFT.tasks);
      await zetaXP.mintNFT(invitee.address, 1, sampleNFT.data, sampleNFT.tasksId, sampleNFT.tasks, sig);

      await validateNFT(sampleNFT);
    });

    it("Should emit event on minting", async () => {
      const sig = await getSignature(inviter, invitee.address, 1, sampleNFT.data, sampleNFT.tasksId, sampleNFT.tasks);
      const tx = zetaXP.mintNFT(invitee.address, 1, sampleNFT.data, sampleNFT.tasksId, sampleNFT.tasks, sig);
      await expect(tx).to.emit(zetaXP, "NewNFTMinted").withArgs(invitee.address, 1);
    });

    it("Should revert if signature it's not correct", async () => {
      const sig = await getSignature(addrs[0], invitee.address, 1, sampleNFT.data, sampleNFT.tasksId, sampleNFT.tasks);
      const tx = zetaXP.mintNFT(invitee.address, 1, sampleNFT.data, sampleNFT.tasksId, sampleNFT.tasks, sig);
      await expect(tx).to.be.revertedWith("InvalidSigner");
    });

    it("Should update NFT", async () => {
      const sig = await getSignature(inviter, invitee.address, 1, sampleNFT.data, sampleNFT.tasksId, sampleNFT.tasks);
      await zetaXP.mintNFT(invitee.address, 1, sampleNFT.data, sampleNFT.tasksId, sampleNFT.tasks, sig);

      const updatedSampleNFT = {
        data: {
          enrollDate: 5435,
          generation: 2314,
          level: 7,
          mintDate: 34,
          testnetCampaignParticipant: 2,
          xpTotal: 100,
        },
        tasks: [
          {
            completed: true,
            count: 10,
          },
          {
            completed: true,
            count: 5,
          },
        ],
        tasksId: [2, 3],
        to: invitee.address,
        tokenId: 1,
      };

      const updatedSig = await getSignature(
        inviter,
        invitee.address,
        1,
        updatedSampleNFT.data,
        updatedSampleNFT.tasksId,
        updatedSampleNFT.tasks
      );
      await zetaXP.updateNFT(1, updatedSampleNFT.data, updatedSampleNFT.tasksId, updatedSampleNFT.tasks, updatedSig);

      validateNFT(updatedSampleNFT);
    });
  });

  it("Should update base url", async () => {
    await zetaXP.setBaseURI("https://api.zetachain.io/nft/v2/");
    const url = await zetaXP.baseTokenURI();
    await expect(url).to.be.eq("https://api.zetachain.io/nft/v2/");

    const sig = await getSignature(inviter, invitee.address, 1, sampleNFT.data, sampleNFT.tasksId, sampleNFT.tasks);
    await zetaXP.mintNFT(invitee.address, 1, sampleNFT.data, sampleNFT.tasksId, sampleNFT.tasks, sig);
    const tokenURI = await zetaXP.tokenURI(1);
    await expect(tokenURI).to.be.eq("https://api.zetachain.io/nft/v2/1");
  });

  it("Should revert if not owner want to update base url", async () => {
    const tx = zetaXP.connect(addrs[0]).setBaseURI("https://api.zetachain.io/nft/v2/");
    expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
  });
});
