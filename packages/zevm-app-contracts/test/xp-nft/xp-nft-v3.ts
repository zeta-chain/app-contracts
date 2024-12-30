import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

import { ZetaXP_V3 } from "../../typechain-types";
import { getSignature, NFT, NFTSigned } from "./test.helpers";

const ZETA_BASE_URL = "https://api.zetachain.io/nft/";
const HARDHAT_CHAIN_ID = 1337;

const encodeTag = (tag: string) => ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["string"], [tag]));

const getTokenIdFromRecipient = (receipt: any): number => {
  //@ts-ignore
  return receipt.events[0].args?.tokenId;
};

describe("XP NFT V3 Contract test", () => {
  let zetaXP: ZetaXP_V3, signer: SignerWithAddress, user: SignerWithAddress, addrs: SignerWithAddress[];
  let sampleNFT: NFT;

  beforeEach(async () => {
    [signer, user, ...addrs] = await ethers.getSigners();
    const zetaXPFactory = await ethers.getContractFactory("ZetaXP");

    zetaXP = await upgrades.deployProxy(zetaXPFactory, [
      "ZETA NFT",
      "ZNFT",
      ZETA_BASE_URL,
      signer.address,
      signer.address,
    ]);

    await zetaXP.deployed();

    const ZetaXPFactory = await ethers.getContractFactory("ZetaXP_V3");
    zetaXP = await upgrades.upgradeProxy(zetaXP.address, ZetaXPFactory);

    const tag = encodeTag("XP_NFT");

    sampleNFT = {
      tag,
      to: user.address,
      tokenId: undefined,
    };
  });

  const mintNFT = async (nft: NFT) => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const sigTimestamp = currentBlock.timestamp;
    const signatureExpiration = sigTimestamp + 1000;

    const signature = await getSignature(
      HARDHAT_CHAIN_ID,
      zetaXP.address,
      signer,
      signatureExpiration,
      sigTimestamp,
      nft.to,
      nft
    );

    const nftParams: NFTSigned = {
      ...nft,
      sigTimestamp,
      signature,
      signatureExpiration,
    } as NFTSigned;

    const tx = await zetaXP.mintNFT(nftParams);
    const receipt = await tx.wait();
    return getTokenIdFromRecipient(receipt);
  };

  it("Should update NFT level", async () => {
    const user2 = addrs[0];
    const sampleNFT2 = { ...sampleNFT, to: user2.address };

    const tokenId = await mintNFT(sampleNFT);
    const tokenId2 = await mintNFT(sampleNFT2);
    {
      const owner1 = await zetaXP.ownerOf(tokenId);
      const owner2 = await zetaXP.ownerOf(tokenId2);
      expect(owner1).to.equal(user.address);
      expect(owner2).to.equal(user2.address);
    }
    {
      const token1 = await zetaXP.tokenByUserTag(user.address, sampleNFT.tag);
      const token2 = await zetaXP.tokenByUserTag(user2.address, sampleNFT.tag);
      expect(token1).to.equal(tokenId);
      expect(token2).to.equal(tokenId2);
    }
    await zetaXP.connect(user).transferFrom(user.address, user2.address, tokenId);
    {
      const owner1 = await zetaXP.ownerOf(tokenId);
      const owner2 = await zetaXP.ownerOf(tokenId2);
      expect(owner1).to.equal(user2.address);
      expect(owner2).to.equal(user2.address);
    }
    {
      const token1 = await zetaXP.tokenByUserTag(user.address, sampleNFT.tag);
      const token2 = await zetaXP.tokenByUserTag(user2.address, sampleNFT.tag);
      expect(token1).to.equal(0);
      expect(token2).to.equal(tokenId2);
    }
    await zetaXP.connect(user2).moveTagToToken(tokenId, sampleNFT.tag);
    {
      const token1 = await zetaXP.tokenByUserTag(user.address, sampleNFT.tag);
      const token2 = await zetaXP.tokenByUserTag(user2.address, sampleNFT.tag);
      expect(token1).to.equal(0);
      expect(token2).to.equal(tokenId);
    }
  });
});
