import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
use(solidity);
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import { ZetaXP } from "../../typechain-types";
import { getSignature, NFT, UpdateParam } from "./test.helpers";

describe("XP NFT Contract test", () => {
  let zetaXP: ZetaXP, signer: SignerWithAddress, user: SignerWithAddress, addrs: SignerWithAddress[];
  let sampleNFT: NFT;

  beforeEach(async () => {
    [signer, user, ...addrs] = await ethers.getSigners();
    const zetaXPFactory = await ethers.getContractFactory("ZetaXP");

    //@ts-ignore
    zetaXP = await zetaXPFactory.deploy("ZETA NFT", "ZNFT", "https://api.zetachain.io/nft/", signer.address);

    sampleNFT = {
      taskIds: [2, 3],
      taskValues: [
        {
          completed: true,
          count: 10,
        },
        {
          completed: false,
          count: 5,
        },
      ],
      to: user.address,
      tokenId: 1,
      xpData: {
        enrollDate: 5435,
        generation: 2314,
        level: 7,
        mintDate: 34,

        testnetCampaignParticipant: 2,
        xpTotal: 67,
      },
    };
  });

  const validateNFT = async (nft: NFT) => {
    const owner = await zetaXP.ownerOf(nft.tokenId);
    await expect(owner).to.be.eq(nft.to);

    const nftData = await zetaXP.zetaXPData(nft.tokenId);
    const { xpData } = nft;
    await expect(nftData.xpTotal).to.be.eq(xpData.xpTotal);
    await expect(nftData.level).to.be.eq(xpData.level);
    await expect(nftData.testnetCampaignParticipant).to.be.eq(xpData.testnetCampaignParticipant);
    await expect(nftData.enrollDate).to.be.eq(xpData.enrollDate);
    await expect(nftData.mintDate).to.be.eq(xpData.mintDate);
    await expect(nftData.generation).to.be.eq(xpData.generation);

    for (let i = 0; i < nft.taskIds.length; i++) {
      const sampleTask = nft.taskValues[i];
      const task = await zetaXP.tasksByTokenId(nft.tokenId, nft.taskIds[i]);
      await expect(task.completed).to.be.eq(sampleTask.completed);
      await expect(task.count).to.be.eq(sampleTask.count);
    }

    const url = await zetaXP.tokenURI(nft.tokenId);
    await expect(url).to.be.eq(`https://api.zetachain.io/nft/${nft.tokenId}`);
  };

  describe("NFT test", () => {
    it("Should mint an NFT", async () => {
      const currentBlock = await ethers.provider.getBlock("latest");
      const sigTimestamp = currentBlock.timestamp;

      const signature = await getSignature(signer, sigTimestamp, user.address, 1, sampleNFT);

      const nftParams: UpdateParam = {
        ...sampleNFT,
        sigTimestamp,
        signature,
        to: user.address,
        tokenId: 1,
      } as UpdateParam;

      await zetaXP.mintNFT(nftParams);

      await validateNFT(sampleNFT);
    });

    it("Should emit event on minting", async () => {
      const currentBlock = await ethers.provider.getBlock("latest");
      const sigTimestamp = currentBlock.timestamp;

      const signature = await getSignature(signer, sigTimestamp, user.address, 1, sampleNFT);

      const nftParams: UpdateParam = {
        ...sampleNFT,
        sigTimestamp,
        signature,
        to: user.address,
        tokenId: 1,
      } as UpdateParam;
      const tx = zetaXP.mintNFT(nftParams);
      await expect(tx).to.emit(zetaXP, "NewNFTMinted").withArgs(user.address, 1);
    });

    it("Should revert if signature it's not correct", async () => {
      const currentBlock = await ethers.provider.getBlock("latest");
      const sigTimestamp = currentBlock.timestamp;

      const signature = await getSignature(addrs[0], sigTimestamp, user.address, 1, sampleNFT);

      const nftParams: UpdateParam = {
        ...sampleNFT,
        sigTimestamp,
        signature,
        to: user.address,
        tokenId: 1,
      } as UpdateParam;

      const tx = zetaXP.mintNFT(nftParams);
      await expect(tx).to.be.revertedWith("InvalidSigner");
    });

    it("Should update NFT", async () => {
      {
        const currentBlock = await ethers.provider.getBlock("latest");
        const sigTimestamp = currentBlock.timestamp;

        const signature = await getSignature(signer, sigTimestamp, user.address, 1, sampleNFT);

        const nftParams: UpdateParam = {
          ...sampleNFT,
          sigTimestamp,
          signature,
          to: user.address,
          tokenId: 1,
        } as UpdateParam;

        await zetaXP.mintNFT(nftParams);
      }

      const updatedSampleNFT = {
        taskIds: [2, 3],
        taskValues: [
          {
            completed: true,
            count: 10,
          },
          {
            completed: true,
            count: 5,
          },
        ],
        to: user.address,
        tokenId: 1,
        xpData: {
          enrollDate: 5435,
          generation: 2314,
          level: 7,
          mintDate: 34,
          testnetCampaignParticipant: 2,
          xpTotal: 100,
        },
      };

      {
        const currentBlock = await ethers.provider.getBlock("latest");
        const sigTimestamp = currentBlock.timestamp;

        const signature = await getSignature(signer, sigTimestamp, user.address, 1, updatedSampleNFT);

        const nftParams: UpdateParam = {
          ...updatedSampleNFT,
          sigTimestamp,
          signature,
          to: user.address,
          tokenId: 1,
        } as UpdateParam;

        await zetaXP.updateNFT(nftParams);
      }

      validateNFT(updatedSampleNFT);
    });
  });

  it("Should update base url", async () => {
    await zetaXP.setBaseURI("https://api.zetachain.io/nft/v2/");
    const url = await zetaXP.baseTokenURI();
    await expect(url).to.be.eq("https://api.zetachain.io/nft/v2/");

    {
      const currentBlock = await ethers.provider.getBlock("latest");
      const sigTimestamp = currentBlock.timestamp;

      const signature = await getSignature(signer, sigTimestamp, user.address, 1, sampleNFT);

      const nftParams: UpdateParam = {
        ...sampleNFT,
        sigTimestamp,
        signature,
        to: user.address,
        tokenId: 1,
      } as UpdateParam;

      await zetaXP.mintNFT(nftParams);
    }
    const tokenURI = await zetaXP.tokenURI(1);
    await expect(tokenURI).to.be.eq("https://api.zetachain.io/nft/v2/1");
  });

  it("Should revert if not owner want to update base url", async () => {
    const tx = zetaXP.connect(addrs[0]).setBaseURI("https://api.zetachain.io/nft/v2/");
    expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should revert if try to transfer", async () => {
    {
      const currentBlock = await ethers.provider.getBlock("latest");
      const sigTimestamp = currentBlock.timestamp;

      const signature = await getSignature(signer, sigTimestamp, user.address, 1, sampleNFT);

      const nftParams: UpdateParam = {
        ...sampleNFT,
        sigTimestamp,
        signature,
        to: user.address,
        tokenId: 1,
      } as UpdateParam;

      await zetaXP.mintNFT(nftParams);
    }
    const tx = zetaXP.connect(user).transferFrom(user.address, addrs[0].address, 1);
    await expect(tx).to.be.revertedWith("TransferNotAllowed");
  });

  it("Should revert if try to use same signature twice", async () => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const sigTimestamp = currentBlock.timestamp;

    const signature = await getSignature(signer, sigTimestamp, user.address, 1, sampleNFT);

    const nftParams: UpdateParam = {
      ...sampleNFT,
      sigTimestamp,
      signature,
      to: user.address,
      tokenId: 1,
    } as UpdateParam;

    await zetaXP.mintNFT(nftParams);

    const tx = zetaXP.updateNFT(nftParams);
    await expect(tx).to.be.revertedWith("OutdatedSignature");
  });
});
