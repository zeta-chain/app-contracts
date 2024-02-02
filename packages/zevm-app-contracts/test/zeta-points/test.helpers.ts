import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

export const getInvitationSig = async (signer: SignerWithAddress, expirationDate: number) => {
  const payload = ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [signer.address, expirationDate]);

  const payloadHash = ethers.utils.keccak256(payload);

  // This adds the message prefix
  const signature = await signer.signMessage(ethers.utils.arrayify(payloadHash));
  return ethers.utils.splitSignature(signature);
};
