import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export interface Enrollment {
  to: string;
}

export interface EnrollmentSigned extends Enrollment {
  signature: string;
  signatureExpiration: number;
}

export const getEnrollmentSignature = async (
  chainId: number,
  verifyingContract: string,
  signer: SignerWithAddress,
  signatureExpiration: number,
  to: string
) => {
  const domain = {
    chainId: chainId,
    name: "InvitationManagerV2",
    verifyingContract: verifyingContract,
    version: "1",
  };

  const types = {
    Verify: [
      { name: "to", type: "address" },
      { name: "signatureExpiration", type: "uint256" },
    ],
  };

  const value = {
    signatureExpiration,
    to,
  };
  // Signing the data
  const signature = await signer._signTypedData(domain, types, value);
  return signature;
};
