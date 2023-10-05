import { MaxUint256 } from "@ethersproject/constants";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, network } from "hardhat";

import { UniswapV2Router02__factory } from "../../../zevm-example-contracts/typechain-types";
import { ERC20__factory, MockZETA, MockZETA__factory } from "../../typechain-types";

const ZETA_INITIAL_SUPPLY = parseUnits("25000000");
const LIQUIDITY_TO_ADD = parseUnits("500000");
const uniswapRouterAddress = "0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe";

export const getNow = async () => {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
};

const addLiquidity = async (tokenAddress1: string, tokenAddress2: string, deployer: SignerWithAddress) => {
  const uniswapRouter = await UniswapV2Router02__factory.connect(uniswapRouterAddress, deployer);

  const tokenContract1 = ERC20__factory.connect(tokenAddress1, deployer);

  const tokenContract2 = ERC20__factory.connect(tokenAddress2, deployer);

  const tx1 = await tokenContract1.approve(uniswapRouter.address, MaxUint256);
  await tx1.wait();

  const tx2 = await tokenContract2.approve(uniswapRouter.address, MaxUint256);
  await tx2.wait();

  const initialBalance1 = await tokenContract1.balanceOf(deployer.address);
  const initialBalance2 = await tokenContract2.balanceOf(deployer.address);
  console.log(`initialBalance1: ${initialBalance1.toString()}`);
  console.log(`initialBalance2: ${initialBalance2.toString()}`);

  const tx3 = await uniswapRouter.addLiquidity(
    tokenAddress1,
    tokenAddress2,
    LIQUIDITY_TO_ADD,
    LIQUIDITY_TO_ADD,
    0,
    0,
    deployer.address,
    (await getNow()) + 360,
    { gasLimit: 10_000_000 }
  );
  await tx3.wait();
};

export async function deployZetaToken() {
  const accounts = await ethers.getSigners();
  const [signer] = accounts;

  const factory = new MockZETA__factory(signer);
  const contract = await factory.deploy(signer.address, ZETA_INITIAL_SUPPLY, "ZetaMock1", "ZETAM1");
  await contract.deployed();
  console.log("Deployed Zeta1 to:", contract.address);

  const contract2 = await factory.deploy(signer.address, ZETA_INITIAL_SUPPLY, "ZetaMock2", "ZETAM2");
  await contract2.deployed();
  console.log("Deployed Zeta2 to:", contract2.address);

  await addLiquidity(contract.address, contract2.address, signer);
}
if (!process.env.EXECUTE_PROGRAMMATICALLY) {
  deployZetaToken()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
