//@ts-ignore
import { BigNumber } from "@ethersproject/bignumber";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, network } from "hardhat";

export const getInvitationSig = async (signer: SignerWithAddress, invitee: string) => {
  let payload = ethers.utils.defaultAbiCoder.encode(["address", "address"], [signer.address, invitee]);

  let payloadHash = ethers.utils.keccak256(payload);

  // This adds the message prefix
  let signature = await signer.signMessage(ethers.utils.arrayify(payloadHash));
  return ethers.utils.splitSignature(signature);
};
