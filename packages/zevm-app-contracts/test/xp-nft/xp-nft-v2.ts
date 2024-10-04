import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

import { ZetaXP_V2 } from "../../typechain-types";
import { getSelLevelSignature, getSignature, NFT, NFTSigned } from "./test.helpers";

const ZETA_BASE_URL = "https://api.zetachain.io/nft/";
const HARDHAT_CHAIN_ID = 1337;

const encodeTag = (tag: string) => ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["string"], [tag]));

const getTokenIdFromRecipient = (receipt: any): number => {
  //@ts-ignore
  return receipt.events[0].args?.tokenId;
};

describe("XP NFT V2 Contract test", () => {
  let zetaXP: ZetaXP_V2, signer: SignerWithAddress, user: SignerWithAddress, addrs: SignerWithAddress[];
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

    const ZetaXPFactory = await ethers.getContractFactory("ZetaXP_V2");
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
      ...sampleNFT,
      sigTimestamp,
      signature,
      signatureExpiration,
    } as NFTSigned;

    const tx = await zetaXP.mintNFT(nftParams);
    const receipt = await tx.wait();
    return getTokenIdFromRecipient(receipt);
  };

  it("Should update NFT level", async () => {
    const tokenId = await mintNFT(sampleNFT);

    const currentBlock = await ethers.provider.getBlock("latest");
    const sigTimestamp = currentBlock.timestamp;
    const signatureExpiration = sigTimestamp + 1000;
    const level = 3;

    const signature = await getSelLevelSignature(
      HARDHAT_CHAIN_ID,
      zetaXP.address,
      signer,
      signatureExpiration,
      sigTimestamp,
      tokenId,
      level
    );

    await zetaXP.setLevel({ level, sigTimestamp, signature, signatureExpiration, tokenId });
    const onchainLevel = await zetaXP.getLevel(tokenId);
    expect(onchainLevel).to.be.eq(level);
  });

  it("Should emit event on set level", async () => {
    const tokenId = await mintNFT(sampleNFT);

    const currentBlock = await ethers.provider.getBlock("latest");
    const sigTimestamp = currentBlock.timestamp;
    const signatureExpiration = sigTimestamp + 1000;
    const level = 3;

    const signature = await getSelLevelSignature(
      HARDHAT_CHAIN_ID,
      zetaXP.address,
      signer,
      signatureExpiration,
      sigTimestamp,
      tokenId,
      level
    );

    const tx = zetaXP.setLevel({ level, sigTimestamp, signature, signatureExpiration, tokenId });
    await expect(tx).to.emit(zetaXP, "LevelSet").withArgs(signer.address, tokenId, level);
  });
});
