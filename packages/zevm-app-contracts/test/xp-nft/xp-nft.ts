import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
use(solidity);
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, upgrades } from "hardhat";

import { ZetaXP } from "../../typechain-types";
import { getSignature, NFT, UpdateParam } from "./test.helpers";

const ZETA_BASE_URL = "https://api.zetachain.io/nft/";

describe("XP NFT Contract test", () => {
  let zetaXP: ZetaXP, signer: SignerWithAddress, user: SignerWithAddress, addrs: SignerWithAddress[];
  let sampleNFT: NFT;

  beforeEach(async () => {
    [signer, user, ...addrs] = await ethers.getSigners();
    const zetaXPFactory = await ethers.getContractFactory("ZetaXP");

    zetaXP = await upgrades.deployProxy(zetaXPFactory, ["ZETA NFT", "ZNFT", ZETA_BASE_URL, signer.address]);

    await zetaXP.deployed();
    const tag = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["string"], ["XP_NFT"]));

    sampleNFT = {
      signedUp: 1234,
      tag,
      to: user.address,
    };
  });

  const validateNFT = async (tokenId: number, nft: NFT) => {
    const owner = await zetaXP.ownerOf(tokenId);
    await expect(owner).to.be.eq(nft.to);

    const url = await zetaXP.tokenURI(tokenId);
    await expect(url).to.be.eq(`${ZETA_BASE_URL}${tokenId}`);
  };

  const getTokenIdFromRecipient = (receipt: any): number => {
    //@ts-ignore
    return receipt.events[0].args?.tokenId;
  };

  it("Should mint an NFT", async () => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const sigTimestamp = currentBlock.timestamp;

    const signature = await getSignature(signer, sigTimestamp, sampleNFT.to, sampleNFT);

    const nftParams: UpdateParam = {
      ...sampleNFT,
      sigTimestamp,
      signature,
    } as UpdateParam;

    const tx = await zetaXP.mintNFT(nftParams);
    const receipt = await tx.wait();
    const tokenId = getTokenIdFromRecipient(receipt);

    await validateNFT(tokenId, sampleNFT);
  });

  it("Should emit event on minting", async () => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const sigTimestamp = currentBlock.timestamp;

    const signature = await getSignature(signer, sigTimestamp, sampleNFT.to, sampleNFT);

    const nftParams: UpdateParam = {
      ...sampleNFT,
      sigTimestamp,
      signature,
    } as UpdateParam;
    const tx = zetaXP.mintNFT(nftParams);
    await expect(tx).to.emit(zetaXP, "NFTMinted").withArgs(user.address, 1, sampleNFT.tag);
  });

  it("Should revert if signature is not correct", async () => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const sigTimestamp = currentBlock.timestamp;

    const signature = await getSignature(addrs[0], sigTimestamp, sampleNFT.to, sampleNFT);

    const nftParams: UpdateParam = {
      ...sampleNFT,
      sigTimestamp,
      signature,
    } as UpdateParam;

    const tx = zetaXP.mintNFT(nftParams);
    await expect(tx).to.be.revertedWith("InvalidSigner");
  });

  it("Should update NFT", async () => {
    let tokenId = -1;
    {
      const currentBlock = await ethers.provider.getBlock("latest");
      const sigTimestamp = currentBlock.timestamp;

      const signature = await getSignature(signer, sigTimestamp, sampleNFT.to, sampleNFT);

      const nftParams: UpdateParam = {
        ...sampleNFT,
        sigTimestamp,
        signature,
      } as UpdateParam;

      const tx = await zetaXP.mintNFT(nftParams);
      const receipt = await tx.wait();
      tokenId = getTokenIdFromRecipient(receipt);
    }

    const updatedSampleNFT = { ...sampleNFT, signedUp: 4321 };

    {
      const currentBlock = await ethers.provider.getBlock("latest");
      const sigTimestamp = currentBlock.timestamp;

      const signature = await getSignature(signer, sigTimestamp, sampleNFT.to, updatedSampleNFT);

      const nftParams: UpdateParam = {
        ...updatedSampleNFT,
        sigTimestamp,
        signature,
      } as UpdateParam;

      await zetaXP.updateNFT(tokenId, nftParams);
    }

    validateNFT(tokenId, updatedSampleNFT);
  });

  it("Should update base url", async () => {
    await zetaXP.setBaseURI(`${ZETA_BASE_URL}v2/`);
    const url = await zetaXP.baseTokenURI();
    await expect(url).to.be.eq(`${ZETA_BASE_URL}v2/`);

    {
      const currentBlock = await ethers.provider.getBlock("latest");
      const sigTimestamp = currentBlock.timestamp;

      const signature = await getSignature(signer, sigTimestamp, sampleNFT.to, sampleNFT);

      const nftParams: UpdateParam = {
        ...sampleNFT,
        sigTimestamp,
        signature,
      } as UpdateParam;

      await zetaXP.mintNFT(nftParams);
    }
    const tokenURI = await zetaXP.tokenURI(1);
    await expect(tokenURI).to.be.eq(`${ZETA_BASE_URL}v2/1`);
  });

  it("Should update base url for minted tokens", async () => {
    {
      const currentBlock = await ethers.provider.getBlock("latest");
      const sigTimestamp = currentBlock.timestamp;

      const signature = await getSignature(signer, sigTimestamp, sampleNFT.to, sampleNFT);

      const nftParams: UpdateParam = {
        ...sampleNFT,
        sigTimestamp,
        signature,
      } as UpdateParam;

      await zetaXP.mintNFT(nftParams);
    }

    await zetaXP.setBaseURI(`${ZETA_BASE_URL}v2/`);
    const url = await zetaXP.baseTokenURI();
    await expect(url).to.be.eq(`${ZETA_BASE_URL}v2/`);

    {
      const sampleNFT2 = { ...sampleNFT, tokenId: 2 };
      const currentBlock = await ethers.provider.getBlock("latest");
      const sigTimestamp = currentBlock.timestamp;

      const signature = await getSignature(signer, sigTimestamp, user.address, sampleNFT2);

      const nftParams: UpdateParam = {
        ...sampleNFT2,
        sigTimestamp,
        signature,
      } as UpdateParam;

      await zetaXP.mintNFT(nftParams);
    }
    const tokenURI1 = await zetaXP.tokenURI(1);
    await expect(tokenURI1).to.be.eq(`${ZETA_BASE_URL}v2/1`);

    const tokenURI2 = await zetaXP.tokenURI(1);
    await expect(tokenURI2).to.be.eq(`${ZETA_BASE_URL}v2/1`);
  });

  it("Should revert if not owner want to update base url", async () => {
    const tx = zetaXP.connect(addrs[0]).setBaseURI(`${ZETA_BASE_URL}v2/`);
    expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should revert if try to transfer", async () => {
    {
      const currentBlock = await ethers.provider.getBlock("latest");
      const sigTimestamp = currentBlock.timestamp;

      const signature = await getSignature(signer, sigTimestamp, sampleNFT.to, sampleNFT);

      const nftParams: UpdateParam = {
        ...sampleNFT,
        sigTimestamp,
        signature,
      } as UpdateParam;

      await zetaXP.mintNFT(nftParams);
    }
    const tx = zetaXP.connect(user).transferFrom(user.address, addrs[0].address, 1);
    await expect(tx).to.be.revertedWith("TransferNotAllowed");
  });

  it("Should revert if try to use same signature twice", async () => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const sigTimestamp = currentBlock.timestamp;

    const signature = await getSignature(signer, sigTimestamp, sampleNFT.to, sampleNFT);

    const nftParams: UpdateParam = {
      ...sampleNFT,
      sigTimestamp,
      signature,
    } as UpdateParam;

    const tx = await zetaXP.mintNFT(nftParams);
    const receipt = await tx.wait();
    const tokenId = getTokenIdFromRecipient(receipt);

    const tx1 = zetaXP.updateNFT(tokenId, nftParams);
    await expect(tx1).to.be.revertedWith("OutdatedSignature");
  });

  it("Should upgrade", async () => {
    const version = await zetaXP.version();
    await expect(version).to.be.eq("1.0.0");

    const ZetaXPFactory = await ethers.getContractFactory("ZetaXPV2");
    const zetaXPV2 = await upgrades.upgradeProxy(zetaXP.address, ZetaXPFactory);

    const version2 = await zetaXPV2.version();
    await expect(version2).to.be.eq("2.0.0");
  });
});
