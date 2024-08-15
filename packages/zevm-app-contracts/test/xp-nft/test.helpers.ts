import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

export interface Signature {
  r: string;
  s: string;
  v: number;
}

export interface NFT {
  signedUp: number;
  tag: string;
  to: string;
}

export interface UpdateParam extends NFT {
  sigTimestamp: number;
  signature: Signature;
  tokenId: number;
}

export const getSignature = async (signer: SignerWithAddress, timestamp: number, to: string, nft: NFT) => {
  let payload = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256", "uint256", "bytes32"],
    [to, timestamp, nft.signedUp, nft.tag]
  );

  const payloadHash = ethers.utils.keccak256(payload);

  // This adds the message prefix
  const signature = await signer.signMessage(ethers.utils.arrayify(payloadHash));
  return ethers.utils.splitSignature(signature);
};
