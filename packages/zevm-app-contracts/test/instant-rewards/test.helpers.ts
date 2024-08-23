import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export interface Signature {
  r: string;
  s: string;
  v: number;
}

export interface ClaimData {
  amount: BigNumber;
  sigExpiration: number;
  taskId: string;
  to: string;
}

export interface ClaimDataSigned extends ClaimData {
  signature: Signature;
}

export const getSignature = async (signer: SignerWithAddress, claimData: ClaimData) => {
  let payload = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256", "bytes32", "uint256"],
    [claimData.to, claimData.sigExpiration, claimData.taskId, claimData.amount]
  );

  const payloadHash = ethers.utils.keccak256(payload);

  // This adds the message prefix
  const signature = await signer.signMessage(ethers.utils.arrayify(payloadHash));
  return ethers.utils.splitSignature(signature);
};
