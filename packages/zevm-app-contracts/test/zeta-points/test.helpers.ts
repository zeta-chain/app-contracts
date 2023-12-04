import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

export const getInvitationSig = async (signer: SignerWithAddress) => {
  let payload = ethers.utils.defaultAbiCoder.encode(["address"], [signer.address]);

  let payloadHash = ethers.utils.keccak256(payload);

  // This adds the message prefix
  let signature = await signer.signMessage(ethers.utils.arrayify(payloadHash));
  return ethers.utils.splitSignature(signature);
};
