import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network } from "hardhat";

import { ERC20__factory, WithdrawERC20__factory } from "../../typechain-types";
import { saveAddress } from "../address.helpers";

const networkName = network.name;

async function main() {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const WithdrawERC20Factory = (await ethers.getContractFactory("WithdrawERC20")) as WithdrawERC20__factory;

  // const withdrawERC20 = await WithdrawERC20Factory.deploy();
  // await withdrawERC20.deployed();
  // console.log("WithdrawERC20 deployed to:", withdrawERC20.address);
  // saveAddress("withdrawERC20", withdrawERC20.address);

  const WithdrawERC20 = WithdrawERC20Factory.attach("0x16a790cf206bbcd30cb2e36cc7b1f890d260b80c");
  const ERC20Factory = (await ethers.getContractFactory("ERC20")) as ERC20__factory;
  const erc20 = ERC20Factory.attach("0x0cbe0dF132a6c6B4a2974Fa1b7Fb953CF0Cc798a");

  await erc20.approve(WithdrawERC20.address, ethers.utils.parseUnits("5", 6));
  await WithdrawERC20.withdraw(
    erc20.address,
    ethers.utils.parseUnits("5", 6),
    "0x19caCb4c0A7fC25598CC44564ED0eCA01249fc31"
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
