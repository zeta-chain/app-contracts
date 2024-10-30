import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network } from "hardhat";

import { getSelLevelSignature } from "../../test/xp-nft/test.helpers";
import { ZetaXP_V2 } from "../../typechain-types";
import { getZEVMAppAddress, saveAddress } from "../address.helpers";

const networkName = network.name;

const user = "0x19caCb4c0A7fC25598CC44564ED0eCA01249fc31";
const encodeTag = (tag: string) => ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["string"], [tag]));

// Helper function to set the level of an NFT
const setLevelToNFT = async (tokenId: number, level: number, zetaXP: ZetaXP_V2, signer: SignerWithAddress) => {
  const currentBlock = await ethers.provider.getBlock("latest");
  const sigTimestamp = currentBlock.timestamp;
  const signatureExpiration = sigTimestamp + 1000;

  const currentChainId = (await ethers.provider.getNetwork()).chainId;
  const signature = await getSelLevelSignature(
    currentChainId,
    zetaXP.address,
    signer,
    signatureExpiration,
    sigTimestamp,
    tokenId,
    level
  );

  await zetaXP.setLevel({ level, sigTimestamp, signature, signatureExpiration, tokenId });
};

const callGov = async () => {
  const [signer] = await ethers.getSigners();

  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  const zetaXPAddress = getZEVMAppAddress("ZetaXP", networkName);
  console.log("ZetaXP address:", zetaXPAddress);

  const XPNFT = await ethers.getContractFactory("ZetaXP_V2");
  const xpnft = await XPNFT.attach(zetaXPAddress);

  const xpSigner = await xpnft.signerAddress();
  console.log("XP Signer:", xpSigner);

  const tag = encodeTag("XP_NFT");
  console.log("Tag:", tag);
  const id = await xpnft.tokenByUserTag(user, tag);
  console.log("ID:", id);

  const level = await xpnft.getLevel(id);
  console.log("Level:", level);

  if (level.toNumber() === 0) {
    await setLevelToNFT(id, 3, xpnft, signer);
  }
};

const main = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  await callGov();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
