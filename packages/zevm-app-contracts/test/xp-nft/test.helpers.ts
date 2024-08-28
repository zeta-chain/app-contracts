import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export interface NFT {
  tag: string;
  to: string;
  tokenId: number | undefined;
}

export interface NFTSigned extends NFT {
  sigTimestamp: number;
  signature: string;
  signatureExpiration: number;
}

export const getSignature = async (
  chainId: number,
  verifyingContract: string,
  signer: SignerWithAddress,
  signatureExpiration: number,
  timestamp: number,
  to: string,
  nft: NFT
) => {
  const domain = {
    chainId: chainId,
    name: "ZetaXP",
    verifyingContract: verifyingContract,
    version: "1",
  };

  const types = {
    MintOrUpdateNFT: [
      { name: "to", type: "address" },
      { name: "signatureExpiration", type: "uint256" },
      { name: "sigTimestamp", type: "uint256" },
      { name: "tag", type: "bytes32" },
    ],
  };

  const value = {
    sigTimestamp: timestamp,
    signatureExpiration,
    tag: nft.tag,
    to,
  };
  // Signing the data
  const signature = await signer._signTypedData(domain, types, value);
  return signature;
};
