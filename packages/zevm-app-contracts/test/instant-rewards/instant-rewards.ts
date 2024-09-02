import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, utils } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import { InstantRewards } from "../../typechain-types";
import { ClaimData, getSignature } from "./test.helpers";

const HARDHAT_CHAIN_ID = 1337;

describe("Instant Rewards Contract test", () => {
  let instantRewards: InstantRewards,
    owner: SignerWithAddress,
    signer: SignerWithAddress,
    user: SignerWithAddress,
    addrs: SignerWithAddress[];

  const encodeTaskId = (taskId: string) => utils.keccak256(utils.defaultAbiCoder.encode(["string"], [taskId]));

  const getClaimDataSigned = async (
    chainId: number,
    verifyingContract: string,
    signer: SignerWithAddress,
    amount: BigNumber,
    sigExpiration: number,
    taskId: string,
    to: string
  ) => {
    const claimData: ClaimData = {
      amount,
      sigExpiration,
      taskId,
      to,
    };

    const signature = await getSignature(chainId, verifyingContract, signer, claimData);
    return {
      ...claimData,
      signature,
    };
  };

  beforeEach(async () => {
    [owner, signer, user, ...addrs] = await ethers.getSigners();
    const instantRewardsFactory = await ethers.getContractFactory("InstantRewards");

    instantRewards = await instantRewardsFactory.deploy(signer.address, owner.address);

    await instantRewards.deployed();
  });

  it("Should claim", async () => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const sigExpiration = currentBlock.timestamp + 1000;
    const amount = utils.parseEther("1");
    const taskId = encodeTaskId("WALLET/TASK/EPOC");
    const to = owner.address;

    // transfer some funds to the contract
    await owner.sendTransaction({
      to: instantRewards.address,
      value: amount,
    });

    const claimDataSigned = await getClaimDataSigned(
      HARDHAT_CHAIN_ID,
      instantRewards.address,
      signer,
      amount,
      sigExpiration,
      taskId,
      to
    );

    const tx = instantRewards.claim(claimDataSigned);
    await expect(tx).to.emit(instantRewards, "Claimed").withArgs(owner.address, taskId, amount);
  });

  it("Should claim if pause and unpause", async () => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const sigExpiration = currentBlock.timestamp + 1000;
    const amount = utils.parseEther("1");
    const taskId = encodeTaskId("WALLET/TASK/EPOC");
    const to = owner.address;

    await instantRewards.pause();
    await instantRewards.unpause();

    // transfer some funds to the contract
    await owner.sendTransaction({
      to: instantRewards.address,
      value: amount,
    });

    const claimDataSigned = await getClaimDataSigned(
      HARDHAT_CHAIN_ID,
      instantRewards.address,
      signer,
      amount,
      sigExpiration,
      taskId,
      to
    );

    const tx = instantRewards.claim(claimDataSigned);
    await expect(tx).to.emit(instantRewards, "Claimed").withArgs(owner.address, taskId, amount);
  });

  it("Should revert if try to claim on behalf of somebody else", async () => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const sigExpiration = currentBlock.timestamp + 1000;
    const amount = utils.parseEther("1");
    const taskId = encodeTaskId("WALLET/TASK/EPOC");
    const to = user.address;

    const claimDataSigned = await getClaimDataSigned(
      HARDHAT_CHAIN_ID,
      instantRewards.address,
      signer,
      amount,
      sigExpiration,
      taskId,
      to
    );

    const tx = instantRewards.claim(claimDataSigned);
    await expect(tx).to.revertedWith("InvalidSigner");
  });

  it("Should revert if try to claim with an expired signature", async () => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const sigExpiration = currentBlock.timestamp - 1000;
    const amount = utils.parseEther("1");
    const taskId = encodeTaskId("WALLET/TASK/EPOC");
    const to = owner.address;

    const claimDataSigned = await getClaimDataSigned(
      HARDHAT_CHAIN_ID,
      instantRewards.address,
      signer,
      amount,
      sigExpiration,
      taskId,
      to
    );

    const tx = instantRewards.claim(claimDataSigned);
    await expect(tx).to.revertedWith("SignatureExpired");
  });

  it("Should revert if try to claim when contract it's paused", async () => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const sigExpiration = currentBlock.timestamp + 1000;
    const amount = utils.parseEther("1");
    const taskId = encodeTaskId("WALLET/TASK/EPOC");
    const to = owner.address;

    await instantRewards.pause();

    const claimDataSigned = await getClaimDataSigned(
      HARDHAT_CHAIN_ID,
      instantRewards.address,
      signer,
      amount,
      sigExpiration,
      taskId,
      to
    );

    const tx = instantRewards.claim(claimDataSigned);
    await expect(tx).to.revertedWith("Pausable: paused");
  });

  it("Should revert if try to claim twice with same signature", async () => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const sigExpiration = currentBlock.timestamp + 1000;
    const amount = utils.parseEther("1");
    const taskId = encodeTaskId("WALLET/TASK/EPOC");
    const to = owner.address;

    // transfer some funds to the contract
    await owner.sendTransaction({
      to: instantRewards.address,
      value: amount,
    });

    const claimDataSigned = await getClaimDataSigned(
      HARDHAT_CHAIN_ID,
      instantRewards.address,
      signer,
      amount,
      sigExpiration,
      taskId,
      to
    );

    instantRewards.claim(claimDataSigned);

    const tx = instantRewards.claim(claimDataSigned);
    await expect(tx).to.revertedWith("TaskAlreadyClaimed");
  });

  it("Should revert if try to claim same task with another signature", async () => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const sigExpiration = currentBlock.timestamp + 1000;
    const amount = utils.parseEther("1");
    const taskId = encodeTaskId("WALLET/TASK/EPOC");
    const to = owner.address;

    // transfer some funds to the contract
    await owner.sendTransaction({
      to: instantRewards.address,
      value: amount,
    });

    {
      const claimDataSigned = await getClaimDataSigned(
        HARDHAT_CHAIN_ID,
        instantRewards.address,
        signer,
        amount,
        sigExpiration,
        taskId,
        to
      );
      instantRewards.claim(claimDataSigned);
    }
    const claimDataSigned = await getClaimDataSigned(
      HARDHAT_CHAIN_ID,
      instantRewards.address,
      signer,
      amount.add(parseEther("1")),
      sigExpiration,
      taskId,
      to
    );
    const tx = instantRewards.claim(claimDataSigned);
    await expect(tx).to.revertedWith("TaskAlreadyClaimed");
  });

  it("Should revert if try to claim with an old valid signature if a new one was used", async () => {
    const currentBlock = await ethers.provider.getBlock("latest");
    const sigExpiration = currentBlock.timestamp + 1000;
    const amount = utils.parseEther("2");
    const taskId = encodeTaskId("WALLET/TASK/EPOC");
    const to = owner.address;

    // transfer some funds to the contract
    await owner.sendTransaction({
      to: instantRewards.address,
      value: amount,
    });

    const claimDataSigned = await getClaimDataSigned(
      HARDHAT_CHAIN_ID,
      instantRewards.address,
      signer,
      amount,
      sigExpiration,
      taskId,
      to
    );

    const newClaimDataSigned = await getClaimDataSigned(
      HARDHAT_CHAIN_ID,
      instantRewards.address,
      signer,
      amount,
      sigExpiration + 1000,
      taskId,
      to
    );

    instantRewards.claim(newClaimDataSigned);

    const tx = instantRewards.claim(claimDataSigned);
    await expect(tx).to.revertedWith("TaskAlreadyClaimed");
  });

  it("Should revert if not owner try to pause", async () => {
    const tx = instantRewards.connect(user).pause();
    await expect(tx).to.revertedWith("Ownable: caller is not the owner");
  });

  it("Should transfer ownership", async () => {
    {
      const ownerAddr = await instantRewards.owner();
      expect(ownerAddr).to.be.eq(owner.address);
    }
    await instantRewards.transferOwnership(user.address);
    await instantRewards.connect(user).acceptOwnership();
    {
      const ownerAddr = await instantRewards.owner();
      expect(ownerAddr).to.be.eq(user.address);
    }
  });

  it("Should withdraw by owner", async () => {
    const amount = utils.parseEther("2");
    const amountToWithdraw = utils.parseEther("1");
    // transfer some funds to the contract
    await owner.sendTransaction({
      to: instantRewards.address,
      value: amount,
    });

    const userBalanceBefore = await ethers.provider.getBalance(user.address);

    const tx = instantRewards.withdraw(user.address, amountToWithdraw);
    await expect(tx).to.emit(instantRewards, "Withdrawn").withArgs(user.address, amountToWithdraw);

    const balanceOfContract = await ethers.provider.getBalance(instantRewards.address);
    expect(balanceOfContract).to.be.eq(amount.sub(amountToWithdraw));
    const balanceOfUser = await ethers.provider.getBalance(user.address);
    expect(balanceOfUser).to.be.eq(userBalanceBefore.add(amountToWithdraw));
  });
});
