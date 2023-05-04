import { ethers } from "hardhat";

import { ZetaMultiOutput, ZetaMultiOutput__factory } from "../../typechain-types";
import { SYSTEM_CONTRACT } from "../systemConstants";

const main = async () => {
  console.log(`Deploying MultiOutput...`);

  const Factory = (await ethers.getContractFactory("ZetaMultiOutput")) as ZetaMultiOutput__factory;
  const contract = (await Factory.deploy(SYSTEM_CONTRACT)) as ZetaMultiOutput;
  await contract.deployed();

  console.log("Deployed MultiOutput. Address:", contract.address);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
