import { MaxUint256 } from "@ethersproject/constants";
import { parseEther, parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import {
  MockSystemContract,
  MockSystemContract__factory,
  MockZRC20,
  MockZRC20__factory,
  UniswapV2Router02__factory,
} from "../typechain-types";

const addZetaEthLiquidity = async (signer: SignerWithAddress, token: MockZRC20, uniswapRouterAddr: string) => {
  const block = await ethers.provider.getBlock("latest");

  const tx1 = await token.approve(uniswapRouterAddr, MaxUint256);
  await tx1.wait();

  const uniswapRouterFork = UniswapV2Router02__factory.connect(uniswapRouterAddr, signer);

  const tx2 = await uniswapRouterFork.addLiquidityETH(
    token.address,
    parseUnits("2000"),
    0,
    0,
    signer.address,
    block.timestamp + 360,
    { value: parseUnits("1000") }
  );
  await tx2.wait();
};

interface EvmSetupResult {
  ZRC20Contracts: MockZRC20[];
  systemContract: MockSystemContract;
}

export const evmSetup = async (
  wGasToken: string,
  uniswapFactoryAddr: string,
  uniswapRouterAddr: string
): Promise<EvmSetupResult> => {
  const [signer] = await ethers.getSigners();

  const ZRC20Factory = (await ethers.getContractFactory("MockZRC20")) as MockZRC20__factory;

  const token1Contract = (await ZRC20Factory.deploy(parseUnits("1000000"), "tBNB", "tBNB")) as MockZRC20;
  const token2Contract = (await ZRC20Factory.deploy(parseUnits("1000000"), "gETH", "gETH")) as MockZRC20;
  const token3Contract = (await ZRC20Factory.deploy(parseUnits("1000000"), "tMATIC", "tMATIC")) as MockZRC20;
  const token4Contract = (await ZRC20Factory.deploy(parseUnits("1000000"), "USDC", "USDC")) as MockZRC20;

  const ZRC20Contracts = [token1Contract, token2Contract, token3Contract, token4Contract];

  const SystemContractFactory = (await ethers.getContractFactory("MockSystemContract")) as MockSystemContract__factory;

  const systemContract = (await SystemContractFactory.deploy(
    wGasToken,
    uniswapFactoryAddr,
    uniswapRouterAddr
  )) as MockSystemContract;

  await systemContract.setGasCoinZRC20(97, ZRC20Contracts[0].address);
  await systemContract.setGasCoinZRC20(5, ZRC20Contracts[1].address);
  await systemContract.setGasCoinZRC20(80001, ZRC20Contracts[2].address);
  await ZRC20Contracts[3].setGasFeeAddress(ZRC20Contracts[1].address);
  await ZRC20Contracts[3].setGasFee(parseEther("0.01"));

  await addZetaEthLiquidity(signer, ZRC20Contracts[0], uniswapRouterAddr);
  await addZetaEthLiquidity(signer, ZRC20Contracts[1], uniswapRouterAddr);
  await addZetaEthLiquidity(signer, ZRC20Contracts[2], uniswapRouterAddr);
  await addZetaEthLiquidity(signer, ZRC20Contracts[3], uniswapRouterAddr);

  return { ZRC20Contracts, systemContract };
};
