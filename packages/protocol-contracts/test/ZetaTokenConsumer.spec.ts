import { AddressZero, MaxUint256 } from "@ethersproject/constants";
import { parseEther, parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getAddress } from "@zetachain/addresses";
import chai, { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import {
  deployZetaNonEth,
  getZetaTokenConsumerMock,
  getZetaTokenConsumerUniV2Strategy,
  getZetaTokenConsumerUniV3Strategy,
} from "../lib/contracts.helpers";
import {
  IERC20,
  IERC20__factory,
  IUniswapV2Router02,
  UniswapV2Router02__factory,
  ZetaNonEth,
  ZetaTokenConsumerMock,
  ZetaTokenConsumerUniV2,
  ZetaTokenConsumerUniV3,
} from "../typechain-types";

chai.should();

const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const UNI_ROUTER_V3 = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const UNI_QUOTER_V3 = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
const WETH_ADDR = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

describe.only("ZetaTokenConsumer tests", () => {
  let uniswapV2RouterAddr: string;
  let uniswapV3RouterAddr: string;

  let zetaTokenConsumerUniV2: ZetaTokenConsumerUniV2;
  let zetaTokenConsumerUniV3: ZetaTokenConsumerUniV3;
  let zetaTokenConsumerMock: ZetaTokenConsumerMock;
  let zetaTokenNonEthAddress: string;
  let zetaTokenNonEth: IERC20;

  let accounts: SignerWithAddress[];
  let tssUpdater: SignerWithAddress;
  let tssSigner: SignerWithAddress;
  let randomSigner: SignerWithAddress;
  let blackHoleSigner: SignerWithAddress;

  const getNow = async () => {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  };

  const swapToken = async (signer: SignerWithAddress, tokenAddress: string, expectedAmount: BigNumber) => {
    const uniswapRouter = UniswapV2Router02__factory.connect(uniswapV2RouterAddr, signer);

    const WETH = await uniswapRouter.WETH();
    const path = [WETH, tokenAddress];
    const tx = await uniswapRouter
      .connect(signer)
      .swapETHForExactTokens(expectedAmount, path, signer.address, (await getNow()) + 360, { value: parseEther("10") });

    await tx.wait();
  };

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [tssUpdater, tssSigner, randomSigner, blackHoleSigner] = accounts;

    // zetaTokenNonEth = await deployZetaNonEth({
    //   args: [100_000, tssSigner.address, tssUpdater.address],
    // });

    zetaTokenNonEthAddress = USDC;
    zetaTokenNonEth = IERC20__factory.connect(zetaTokenNonEthAddress, tssSigner);

    uniswapV2RouterAddr = getAddress("uniswapV2Router02", {
      customNetworkName: "eth-mainnet",
      customZetaNetwork: "mainnet",
    });

    zetaTokenConsumerUniV2 = await getZetaTokenConsumerUniV2Strategy({
      deployParams: [zetaTokenNonEthAddress, uniswapV2RouterAddr],
    });

    uniswapV3RouterAddr = UNI_ROUTER_V3;
    zetaTokenConsumerUniV3 = await getZetaTokenConsumerUniV3Strategy({
      deployParams: [zetaTokenNonEthAddress, uniswapV3RouterAddr, UNI_QUOTER_V3, WETH_ADDR],
    });

    zetaTokenConsumerMock = await getZetaTokenConsumerMock(zetaTokenConsumerUniV2.address);
  });

  describe("getZetaFromEth", () => {
    it("should get zeta from eth using UniV2", async () => {
      const initialZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      const tx = await zetaTokenNonEth.connect(randomSigner).transfer(blackHoleSigner.address, initialZetaBalance);
      await tx.wait();

      await zetaTokenConsumerUniV2.connect(randomSigner).getZetaFromEth(1, { value: parseEther("1") });
      const finalZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      console.log(finalZetaBalance.toString());
      await expect(finalZetaBalance).to.be.gt(0);
    });

    it("should get zeta from eth using UniV3", async () => {
      const initialZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      const tx = await zetaTokenNonEth.connect(randomSigner).transfer(blackHoleSigner.address, initialZetaBalance);
      await tx.wait();

      await zetaTokenConsumerUniV3.connect(randomSigner).getZetaFromEth(1, { value: parseEther("1") });
      const finalZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      console.log(finalZetaBalance.toString());
      await expect(finalZetaBalance).to.be.gt(0);
    });
  });

  describe("getZetaFromToken", () => {
    it("should get zeta from token using UniV3", async () => {
      await swapToken(randomSigner, USDC, parseUnits("10000", 6));
      await swapToken(randomSigner, DAI, parseUnits("10000", 18));
      const initialZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      const tx = await zetaTokenNonEth.connect(randomSigner).transfer(blackHoleSigner.address, initialZetaBalance);
      await tx.wait();

      const tx1 = await IERC20__factory.connect(DAI, randomSigner).approve(zetaTokenConsumerUniV3.address, MaxUint256);
      await tx1.wait();

      await zetaTokenConsumerUniV3.connect(randomSigner).getZetaFromToken(1, DAI, parseUnits("100", 18));
      const finalZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      console.log(finalZetaBalance.toString());
      await expect(finalZetaBalance).to.be.gt(0);
    });
  });

  describe("getEthFromZeta", () => {
    //
  });

  describe("getTokenFromZeta", () => {
    //
  });
});
