import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

export interface Signature {
  r: string;
  s: string;
  v: number;
}

export interface NFT {
  signedUp: number;
  to: string;
  tokenId: number;
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
  let payload = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256", "uint256", "uint256"],
    [to, tokenId, timestamp, nft.signedUp]
  );

  const payloadHash = ethers.utils.keccak256(payload);

  // This adds the message prefix
  const signature = await signer.signMessage(ethers.utils.arrayify(payloadHash));
  return ethers.utils.splitSignature(signature);
};
