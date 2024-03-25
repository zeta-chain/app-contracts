import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";

import { WithdrawERC20__factory } from "../../typechain-types/factories/contracts/withdrawErc20/withdrawErc20.sol";
import { getSystemContractAddress, saveAddress } from "../address.helpers";

const networkName = network.name;

const SYSTEM_CONTRACT = getSystemContractAddress(networkName);

async function main() {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const WithdrawERC20Factory = (await ethers.getContractFactory("WithdrawERC20")) as WithdrawERC20__factory;

  const withdrawERC20 = await WithdrawERC20Factory.deploy(SYSTEM_CONTRACT);
  await withdrawERC20.deployed();

  console.log("WithdrawERC20 deployed to:", withdrawERC20.address);
  saveAddress("withdrawERC20", withdrawERC20.address, networkName);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
