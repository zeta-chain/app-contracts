import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

export interface Task {
  completed: boolean;
  count: number;
}

export interface TokenData {
  enrollDate: number;
  generation: number;
  level: number;
  mintDate: number;
  testnetCampaignParticipant: number;
  xpTotal: number;
}

export interface NFT {
  data: TokenData;
  tasks: Task[];
  tasksId: number[];
  to: string;
  tokenId: number;
}

export const getSignature = async (
  signer: SignerWithAddress,
  to: string,
  tokenId: number,
  data: TokenData,
  tasksId: number[],
  tasks: Task[]
) => {
  let payload = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256"],
    [
      to,
      tokenId,
      data.xpTotal,
      data.level,
      data.testnetCampaignParticipant,
      data.enrollDate,
      data.mintDate,
      data.generation,
    ]
  );

  for (let i = 0; i < tasksId.length; i++) {
    payload = ethers.utils.defaultAbiCoder.encode(
      ["bytes", "uint256", "bool", "uint256"],
      [payload, tasksId[i], tasks[i].completed, tasks[i].count]
    );
  }

  const payloadHash = ethers.utils.keccak256(payload);

  // This adds the message prefix
  const signature = await signer.signMessage(ethers.utils.arrayify(payloadHash));
  return ethers.utils.splitSignature(signature);
};
