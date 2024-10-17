import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

import { TimelockController, ZetaXP_V2, ZetaXPGov } from "../../typechain-types";
import { getSelLevelSignature, getSignature, NFT, NFTSigned } from "./test.helpers";

const ZETA_BASE_URL = "https://api.zetachain.io/nft/";
const HARDHAT_CHAIN_ID = 1337;

const encodeTag = (tag: string) => ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["string"], [tag]));

describe("ZetaXPGov", () => {
  let zetaGov: ZetaXPGov,
    zetaXP: ZetaXP_V2,
    timelock: TimelockController,
    signer: SignerWithAddress,
    user: SignerWithAddress,
    addrs: SignerWithAddress[];
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

    // Deploy the TimelockController contract
    const timelockFactory = await ethers.getContractFactory("TimelockController");
    timelock = await timelockFactory.deploy(3600, [signer.address], [signer.address], signer.address);
    await timelock.deployed();

    const tag = encodeTag("XP_NFT");

    sampleNFT = {
      tag,
      to: user.address,
      tokenId: undefined,
    };

    // Deploy the ZetaXPGov contract
    const ZetaXPGovFactory = await ethers.getContractFactory("ZetaXPGov");
    zetaGov = await ZetaXPGovFactory.deploy(zetaXP.address, timelock.address, 4);
    await zetaGov.deployed();

    await zetaGov.setTagValidToVote(encodeTag("XP_NFT"));
  });

  // Helper function to extract token ID from minting receipt
  const getTokenIdFromRecipient = (receipt: any): number => {
    //@ts-ignore
    return receipt.events[0].args?.tokenId;
  };

  // Helper function to mint an NFT to a user
  const mintNFTToUser = async (account: SignerWithAddress) => {
    const nft = sampleNFT;
    nft.to = account.address;

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
    const tokenId = getTokenIdFromRecipient(receipt);

    return tokenId;
  };

  // Helper function to set the level of an NFT
  const setLevelToNFT = async (tokenId: number, level: number) => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const sigTimestamp = currentBlock.timestamp;
    const signatureExpiration = sigTimestamp + 1000;

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
  };

  it("Should be able to vote", async () => {
    const user = addrs[0];
    const nftId = await mintNFTToUser(user);
    await setLevelToNFT(nftId, 3);

    // Create a proposal to vote on
    const targets = ["0x0000000000000000000000000000000000000000"];
    const values = [0];
    const calldatas = ["0x"];
    const description = "Proposal #1";

    const proposeTx = await zetaGov.connect(signer).propose(targets, values, calldatas, description);
    const proposeReceipt = await proposeTx.wait();
    const proposalId = proposeReceipt.events?.find((e) => e.event === "ProposalCreated")?.args?.proposalId;

    // Increase the time and mine blocks to move to the voting phase
    await ethers.provider.send("evm_increaseTime", [7200]); // Fast forward 2 hours to ensure voting delay is over
    await ethers.provider.send("evm_mine", []); // Mine the next block

    // User votes for the proposal using their NFT
    await zetaGov.connect(user).castVote(proposalId, 1); // Assuming 1 is a vote in favor

    // Optionally, increase the block number to simulate time passing and end the voting period
    await ethers.provider.send("evm_increaseTime", [3600]); // Fast forward one hour
    await ethers.provider.send("evm_mine", []); // Mine the next block

    // Queue and execute the proposal after voting period is over
    const descriptionHash = ethers.utils.id(description);
    await zetaGov.connect(signer).queue(targets, values, calldatas, descriptionHash);
    const executeTx = await zetaGov.connect(signer).execute(targets, values, calldatas, descriptionHash);
    await executeTx.wait();

    // Assertions
    const proposalState = await zetaGov.state(proposalId);
    expect(proposalState).to.equal(7); // Assuming 7 means 'executed'
  });
});
