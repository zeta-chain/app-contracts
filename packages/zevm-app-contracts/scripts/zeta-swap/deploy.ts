import { ethers } from "hardhat";

import { ZetaSwap, ZetaSwap__factory, ZetaSwapBtcInbound, ZetaSwapBtcInbound__factory } from "../../typechain-types";
import { getSystemContractAddress, saveAddress } from "../address.helpers";

const main = async () => {
  console.log(`Deploying ZetaSwap...`);
  const SYSTEM_CONTRACT = getSystemContractAddress();

  const Factory = (await ethers.getContractFactory("ZetaSwap")) as ZetaSwap__factory;
  const contract = (await Factory.deploy(SYSTEM_CONTRACT)) as ZetaSwap;
  await contract.deployed();

  console.log("Deployed ZetaSwap. Address:", contract.address);
  saveAddress("zetaSwap", contract.address);

  const FactoryBTC = (await ethers.getContractFactory("ZetaSwapBtcInbound")) as ZetaSwapBtcInbound__factory;
  const contractBTC = (await FactoryBTC.deploy(SYSTEM_CONTRACT)) as ZetaSwapBtcInbound;
  await contractBTC.deployed();

  console.log("Deployed zetaSwapBtcInbound. Address:", contractBTC.address);
  saveAddress("zetaSwapBtcInbound", contractBTC.address);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
