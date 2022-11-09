import { getAddress } from "@zetachain/addresses";
import { saveAddress } from "@zetachain/addresses-tools";
import { ethers } from "hardhat";

import { ZetaSwap, ZetaSwap__factory } from "../../typechain-types";

const main = async () => {
  console.log(`Deploying ZetaSwap...`);

  const WZETA_ADDRESS = getAddress({
    address: "weth9",
    networkName: "athens-v2",
    zetaNetwork: "athens"
  });

  const UNISWAP_ROUTER_ADDRESS = getAddress({
    address: "uniswapV2Router02",
    networkName: "athens-v2",
    zetaNetwork: "athens"
  });

  const Factory = (await ethers.getContractFactory("ZetaSwap")) as ZetaSwap__factory;

  const contract = (await Factory.deploy(WZETA_ADDRESS, UNISWAP_ROUTER_ADDRESS)) as ZetaSwap;

  await contract.deployed();

  console.log("Deployed ZetaSwap. Address:", contract.address);
  saveAddress("zetaSwap", contract.address);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
