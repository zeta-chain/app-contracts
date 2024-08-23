import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { utils } from "ethers";
import { ethers } from "hardhat";

import { InstantRewards } from "../../typechain-types";
import { ClaimData, getSignature } from "./test.helpers";

describe("Instant Rewards Contract test", () => {
  let instantRewards: InstantRewards,
    owner: SignerWithAddress,
    signer: SignerWithAddress,
    user: SignerWithAddress,
    addrs: SignerWithAddress[];

  const encodeTaskId = (taskId: string) => utils.keccak256(utils.defaultAbiCoder.encode(["string"], [taskId]));

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
    const taskId = encodeTaskId("1/1/1");
    const to = owner.address;

    // transfer some funds to the contract
    await owner.sendTransaction({
      to: instantRewards.address,
      value: amount,
    });

    const claimData: ClaimData = {
      amount,
      sigExpiration,
      taskId,
      to,
    };

    const signature = await getSignature(signer, claimData);
    const claimDataSigned = {
      ...claimData,
      signature,
    };

    const tx = instantRewards.claim(claimDataSigned);
    await expect(tx).to.emit(instantRewards, "Claimed").withArgs(owner.address, taskId, amount);
  });

  it("Should transfer ownership", async () => {
    {
      const ownerAddr = await instantRewards.owner();
      expect(ownerAddr).to.be.eq(owner.address);
    }
    await instantRewards.transferOwnership(user.address);
    {
      const ownerAddr = await instantRewards.owner();
      expect(ownerAddr).to.be.eq(user.address);
    }
  });
});
