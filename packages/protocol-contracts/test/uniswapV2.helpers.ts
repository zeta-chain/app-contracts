import { MaxUint256 } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import { IERC20__factory, UniswapV2Router02__factory } from "../typechain-types";

const getNow = async () => {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
};

export const swapToken = async (
  signer: SignerWithAddress,
  tokenAddress: string,
  uniswapV2RouterAddress: string,
  expectedAmount: BigNumber
) => {
  const uniswapRouter = UniswapV2Router02__factory.connect(uniswapV2RouterAddress, signer);

  const WETH = await uniswapRouter.WETH();
  const path = [WETH, tokenAddress];
  const tx = await uniswapRouter
    .connect(signer)
    .swapETHForExactTokens(expectedAmount, path, signer.address, (await getNow()) + 360, { value: parseEther("10") });

  await tx.wait();
};

export interface addZetaEthLiquidityUniV2Params {
  ETHToAdd: BigNumber;
  deployer: SignerWithAddress;
  uniswapRouterV2Address: string;
  zetaToAdd: BigNumber;
  zetaTokenAddress: string;
}

export const addZetaEthLiquidityUniV2 = async ({
  ETHToAdd,
  zetaToAdd,
  deployer,
  zetaTokenAddress,
  uniswapRouterV2Address,
}: addZetaEthLiquidityUniV2Params) => {
  const uniswapRouter = UniswapV2Router02__factory.connect(uniswapRouterV2Address, deployer);
  const zetaToken = IERC20__factory.connect(zetaTokenAddress, deployer);

  const tx1 = await zetaToken.approve(uniswapRouter.address, MaxUint256);
  await tx1.wait();

  const tx2 = await uniswapRouter.addLiquidityETH(
    zetaToken.address,
    zetaToAdd,
    0,
    0,
    deployer.address,
    (await getNow()) + 360,
    { value: ETHToAdd }
  );
  await tx2.wait();
};
