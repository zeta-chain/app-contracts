import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

export interface ClaimData {
  amount: BigNumber;
  sigExpiration: number;
  taskId: string;
  to: string;
}

export interface ClaimDataSigned extends ClaimData {
  signature: string;
}

export const getSignature = async (
  chainId: number,
  verifyingContract: string,
  signer: SignerWithAddress,
  claimData: ClaimData
) => {
  const domain = {
    chainId: chainId,
    name: "InstantRewards",
    verifyingContract: verifyingContract,
    version: "1",
  };

  const types = {
    Claim: [
      { name: "to", type: "address" },
      { name: "sigExpiration", type: "uint256" },
      { name: "taskId", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
  };

  const value = {
    amount: claimData.amount,
    sigExpiration: claimData.sigExpiration,
    taskId: claimData.taskId,
    to: claimData.to,
  };
  // Signing the data
  const signature = await signer._signTypedData(domain, types, value);
  return signature;
};
