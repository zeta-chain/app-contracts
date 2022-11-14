import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "hardhat";

export const encodeParams = (dataTypes: any[], data: any[]) => {
  const abiCoder = ethers.utils.defaultAbiCoder;
  return abiCoder.encode(dataTypes, data);
};

export const getSwapParams = (destination: string, destinationToken: string, minOutput: BigNumber) => {
  const paddedDestination = ethers.utils.hexlify(ethers.utils.zeroPad(destination, 32));
  const params = encodeParams(["address", "bytes32", "uint256"], [destinationToken, paddedDestination, minOutput]);

  return params;
};

export const getSwapData = (zetaSwap: string, destination: string, destinationToken: string, minOutput: BigNumber) => {
  const params = getSwapParams(destination, destinationToken, minOutput);

  return `${zetaSwap}${params.slice(2)}`;
};

const encodeAddressArray = (addresses: string[]) => {
  let hex = "0x";
  hex += addresses.map(address => address.substr(2, 40)).join("");

  return ethers.utils.arrayify(hex);
}


export const getSwapBTCInboundData = (destination: string, destinationToken: string) => {
  return  encodeAddressArray([destination, destinationToken])
};
