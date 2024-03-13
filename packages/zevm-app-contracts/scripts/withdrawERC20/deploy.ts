import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network } from "hardhat";

import { ERC20__factory } from "../../typechain-types";
import { WithdrawERC20__factory } from "../../typechain-types/factories/contracts/withdrawErc20/withdrawErc20.sol";
import { getSystemContractAddress, saveAddress } from "../address.helpers";

const networkName = network.name;

const SYSTEM_CONTRACT = getSystemContractAddress();

const ZUSDC_ADDRESS = "0x0cbe0dF132a6c6B4a2974Fa1b7Fb953CF0Cc798a";
const AMOUNT = ethers.utils.parseUnits("0.5", 6);

async function main() {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const WithdrawERC20Factory = (await ethers.getContractFactory("WithdrawERC20")) as WithdrawERC20__factory;

  const withdrawERC20 = await WithdrawERC20Factory.deploy(SYSTEM_CONTRACT);
  await withdrawERC20.deployed();

  console.log("WithdrawERC20 deployed to:", withdrawERC20.address);
  saveAddress("withdrawERC20", withdrawERC20.address, networkName);
  {
    const [signer] = await ethers.getSigners();
    const withdrawERC20Address = withdrawERC20.address;

    const WithdrawERC20Factory = (await ethers.getContractFactory("WithdrawERC20")) as WithdrawERC20__factory;
    const WithdrawERC20 = WithdrawERC20Factory.attach(withdrawERC20Address);

    const ERC20Factory = (await ethers.getContractFactory("ERC20")) as ERC20__factory;
    const erc20 = ERC20Factory.attach(ZUSDC_ADDRESS);

    await erc20.approve(WithdrawERC20.address, AMOUNT);
    const tx = await WithdrawERC20.withdraw(erc20.address, AMOUNT, signer.address);
    console.log(`Sending transaction ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(receipt);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
