import { saveAddress } from "@zetachain/addresses-tools";
import hardhat from "hardhat";
import { ethers } from "hardhat";

import { ZetaSwap, ZetaSwap__factory } from "../../typechain-types";
import { SWAP_ADDRESS, TOKEN_ADDRESS } from "../systemConstants";

const main = async () => {
  console.log(`Deploying ZetaSwap...`);

  const Factory = (await ethers.getContractFactory("ZetaSwap")) as ZetaSwap__factory;

  const contract = (await Factory.deploy(TOKEN_ADDRESS, SWAP_ADDRESS)) as ZetaSwap;

  await contract.deployed();

  console.log("Deployed ZetaSwap. Address:", contract.address);
  saveAddress("zetaSwap", contract.address);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
