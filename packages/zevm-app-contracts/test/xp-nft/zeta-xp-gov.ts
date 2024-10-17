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
    const zetaXPFactory = await ethers.getContractFactory("ZetaXP_V2");

    zetaXP = await upgrades.deployProxy(zetaXPFactory, [
      "ZETA NFT",
      "ZNFT",
      ZETA_BASE_URL,
      signer.address,
      signer.address,
    ]);

    await zetaXP.deployed();

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

    // Assign proposer and executor roles to the signer
    const proposerRole = await timelock.PROPOSER_ROLE();
    const executorRole = await timelock.EXECUTOR_ROLE();
    await timelock.grantRole(proposerRole, zetaGov.address);
    await timelock.grantRole(executorRole, zetaGov.address);

    await zetaGov.setTagValidToVote(tag);
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

  it("Should be able to vote and meet quorum", async () => {
    const user1 = addrs[0];
    const user2 = addrs[1]; // Añadimos un segundo usuario para alcanzar el quórum

    // Mint NFTs to both users
    const nftId1 = await mintNFTToUser(user1);
    await setLevelToNFT(nftId1, 3);

    const nftId2 = await mintNFTToUser(user2);
    await setLevelToNFT(nftId2, 3);

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

    // Both users vote for the proposal using their NFTs
    await zetaGov.connect(user1).castVote(proposalId, 1); // Assuming 1 is a vote in favor
    await zetaGov.connect(user2).castVote(proposalId, 1); // Second user votes in favor

    // Optionally, increase the block number to simulate time passing and end the voting period
    await ethers.provider.send("evm_increaseTime", [50400]); // Fast forward 1 week to end the voting period
    await ethers.provider.send("evm_mine", []); // Mine the next block

    // Queue the proposal after voting period is over
    const descriptionHash = ethers.utils.id(description);
    await zetaGov.connect(signer).queue(targets, values, calldatas, descriptionHash);

    // Increase time to meet the timelock delay
    await ethers.provider.send("evm_increaseTime", [3600]); // Fast forward 1 hour to meet timelock delay
    await ethers.provider.send("evm_mine", []); // Mine the next block

    // Execute the proposal after the timelock delay has passed
    const executeTx = await zetaGov.connect(signer).execute(targets, values, calldatas, descriptionHash);
    await executeTx.wait();

    // Assertions
    const proposalState = await zetaGov.state(proposalId);
    expect(proposalState).to.equal(7); // Assuming 7 means 'executed'

    // Get the proposal votes after the voting period
    const votes = await zetaGov.proposalVotes(proposalId);
    expect(votes.abstainVotes).to.equal(0);
    expect(votes.againstVotes).to.equal(0);
    expect(votes.forVotes).to.equal(6);
  });
});
