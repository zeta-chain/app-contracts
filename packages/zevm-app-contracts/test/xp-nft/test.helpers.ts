import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

export interface Task {
  completed: boolean;
  count: number;
}

export interface ZetaXPData {
  enrollDate: number;
  generation: number;
  level: number;
  mintDate: number;
  testnetCampaignParticipant: number;
  xpTotal: number;
}

export interface Signature {
  r: string;
  s: string;
  v: number;
}

export interface NFT {
  taskIds: number[];
  taskValues: Task[];
  to: string;
  tokenId: number;
  xpData: ZetaXPData;
}

export interface UpdateParam extends NFT {
  sigTimestamp: number;
  signature: Signature;
}

export const getSignature = async (
  signer: SignerWithAddress,
  timestamp: number,
  to: string,
  tokenId: number,
  nft: NFT
) => {
  const { xpData } = nft;
  let payload = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256"],
    [
      to,
      tokenId,
      timestamp,
      xpData.xpTotal,
      xpData.level,
      xpData.testnetCampaignParticipant,
      xpData.enrollDate,
      xpData.mintDate,
      xpData.generation,
    ]
  );

  for (let i = 0; i < nft.taskIds.length; i++) {
    payload = ethers.utils.defaultAbiCoder.encode(
      ["bytes", "uint256", "bool", "uint256"],
      [payload, nft.taskIds[i], nft.taskValues[i].completed, nft.taskValues[i].count]
    );
  }

  const payloadHash = ethers.utils.keccak256(payload);

  // This adds the message prefix
  const signature = await signer.signMessage(ethers.utils.arrayify(payloadHash));
  return ethers.utils.splitSignature(signature);
};
