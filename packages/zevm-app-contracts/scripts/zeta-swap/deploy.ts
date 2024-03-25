import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network } from "hardhat";

import { ZetaSwap, ZetaSwap__factory, ZetaSwapBtcInbound, ZetaSwapBtcInbound__factory } from "../../typechain-types";
import { getSystemContractAddress, saveAddress } from "../address.helpers";

const networkName = network.name;

const main = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  console.log(`Deploying ZetaSwap...`);
  const SYSTEM_CONTRACT = getSystemContractAddress(networkName);

  const Factory = (await ethers.getContractFactory("ZetaSwap")) as ZetaSwap__factory;
  const contract = (await Factory.deploy(SYSTEM_CONTRACT)) as ZetaSwap;
  await contract.deployed();

  console.log("Deployed ZetaSwap. Address:", contract.address);
  saveAddress("zetaSwap", contract.address, networkName);

  const FactoryBTC = (await ethers.getContractFactory("ZetaSwapBtcInbound")) as ZetaSwapBtcInbound__factory;
  const contractBTC = (await FactoryBTC.deploy(SYSTEM_CONTRACT)) as ZetaSwapBtcInbound;
  await contractBTC.deployed();

  console.log("Deployed zetaSwapBtcInbound. Address:", contractBTC.address);
  saveAddress("zetaSwapBtcInbound", contractBTC.address, networkName);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
