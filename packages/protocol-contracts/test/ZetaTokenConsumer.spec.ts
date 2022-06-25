import { AddressZero, MaxUint256 } from "@ethersproject/constants";
import { parseEther, parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getAddress } from "@zetachain/addresses";
import chai, { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { parse } from "path";

import {
  deployZetaNonEth,
  getZetaTokenConsumerRecommendedStrategy,
  getZetaTokenConsumerUniV2Strategy,
  getZetaTokenConsumerUniV3Strategy,
} from "../lib/contracts.helpers";
import {
  IERC20,
  IERC20__factory,
  INonfungiblePositionManager,
  INonfungiblePositionManager__factory,
  IPoolInitializer__factory,
  IUniswapV2Router02,
  UniswapV2Router02__factory,
  ZetaNonEth,
  ZetaTokenConsumerRecommended,
  ZetaTokenConsumerUniV2,
  ZetaTokenConsumerUniV3,
} from "../typechain-types";

chai.should();

const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const UNI_ROUTER_V3 = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const UNI_QUOTER_V3 = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
const WETH9_ADDR = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const UNI_NFT_MANAGER_V3 = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

describe.only("ZetaTokenConsumer tests", () => {
  let uniswapV2RouterAddr: string;
  let uniswapV3RouterAddr: string;

  let zetaTokenConsumerUniV2: ZetaTokenConsumerUniV2;
  let zetaTokenConsumerUniV3: ZetaTokenConsumerUniV3;
  let zetaTokenConsumerRecommended: ZetaTokenConsumerRecommended;
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

  const createPoolV3 = async (signer: SignerWithAddress, tokenAddress: string) => {
    await swapToken(signer, DAI, parseUnits("10000", 18));

    const token = IERC20__factory.connect(USDC, signer);
    const tx1 = await token.approve(UNI_NFT_MANAGER_V3, MaxUint256);
    await tx1.wait();

    const token2 = IERC20__factory.connect(DAI, signer);
    const tx12 = await token2.approve(UNI_NFT_MANAGER_V3, MaxUint256);
    await tx12.wait();

    const uniswapRouter = INonfungiblePositionManager__factory.connect(UNI_NFT_MANAGER_V3, signer);
    const params: INonfungiblePositionManager.MintParamsStruct = {
      token0: USDC,
      token1: DAI,
      fee: 3000,
      tickLower: 193,
      tickUpper: 194,
      amount0Desired: parseEther("10"),
      amount1Desired: parseEther("10"),
      amount0Min: 0,
      amount1Min: 0,
      recipient: signer.address,
      deadline: (await getNow()) + 360,
    };

    const p = IPoolInitializer__factory.connect(UNI_NFT_MANAGER_V3, signer);
    const tx2 = await p.createAndInitializePoolIfNecessary(USDC, DAI, 3000, "80000000000000000000000000000");
    const r = await tx2.wait();

    const tx3 = await uniswapRouter.mint(params);
    const ret1 = await tx3.wait();
  };

  const createPoolV3Method2 = async (signer: SignerWithAddress, tokenAddress: string) => {
    // let multiCallParams = [
    //   // first call
    //   "0x13ead562" + // encoded function signature ( createAndInitializePoolIfNecessary(address, address, uint24, uint160) )
    //     "000000000000000000000000" +
    //     tokenAddress.toLowerCase().substring(2) + // token1 address
    //     "000000000000000000000000" +
    //     WETH_ADDR.toLowerCase().substring(2) + // token2 address
    //     "00000000000000000000000000000000000000000000000000000000000001f4" + // fee
    //     "000000000000000000000000000000000000000005b96aabfac7cdc4b3b58fc2", // sqrtPriceX96
    //   // second call
    //   "0x88316456" + // encoded function signature ( mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256)) )
    //     "000000000000000000000000" +
    //     tokenAddress.toLowerCase().substring(2) + // token1 address
    //     "000000000000000000000000" +
    //     WETH_ADDR.toLowerCase().substring(2) + // token2 address
    //     "00000000000000000000000000000000000000000000000000000000000001f4" + // fee
    //     "fffffffffffffffffffffffffffffffffffffffffffffffffffffffffff89f0e" + // tick lower
    //     "0000000000000000000000000000000000000000000000000000000000010dd8" + // tick upper
    //     "00000000000000000000000000000000000000000000000ad5a4b6712c4647c3" + // amount 1 desired
    //     "000000000000000000000000000000000000000000000000016345785d8a0000" + // amount 2 desired
    //     "00000000000000000000000000000000000000000000000acebaf563cd50439c" + // min amount 1 expected
    //     "000000000000000000000000000000000000000000000000016261cfc3291456" + // min amount 2 expected
    //     "000000000000000000000000" +
    //     signer.address.toLowerCase().substring(2) + // deployer address
    //     "00000000000000000000000000000000000000000000000000000000610bb8b6", // deadline
    // ];
    // // adding a new liquidity pool through position manager
    // const tx2 = await uniswapRouter.connect(signer).multicall(multiCallParams);
    // const ret = await tx2.wait();
    // console.log(ret);
  };

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [tssUpdater, tssSigner, randomSigner, blackHoleSigner] = accounts;

    zetaTokenNonEth = await deployZetaNonEth({
      args: [100_000, tssSigner.address, tssUpdater.address],
    });

    uniswapV2RouterAddr = getAddress("uniswapV2Router02", {
      customNetworkName: "eth-mainnet",
      customZetaNetwork: "mainnet",
    });

    /// dev: for testing purposes we use and existing uni v3 pool
    await swapToken(tssUpdater, DAI, parseEther("10000"));
    await swapToken(randomSigner, DAI, parseEther("10000"));
    await swapToken(randomSigner, DAI, parseEther("10000"));
    await swapToken(randomSigner, DAI, parseEther("10000"));
    await swapToken(randomSigner, DAI, parseEther("10000"));
    zetaTokenNonEthAddress = DAI;
    zetaTokenNonEth = IERC20__factory.connect(zetaTokenNonEthAddress, tssSigner);

    zetaTokenConsumerUniV2 = await getZetaTokenConsumerUniV2Strategy({
      deployParams: [zetaTokenNonEthAddress, uniswapV2RouterAddr],
    });

    uniswapV3RouterAddr = UNI_ROUTER_V3;
    zetaTokenConsumerUniV3 = await getZetaTokenConsumerUniV3Strategy({
      deployParams: [zetaTokenNonEthAddress, uniswapV3RouterAddr, UNI_QUOTER_V3, WETH9_ADDR],
    });

    zetaTokenConsumerRecommended = await getZetaTokenConsumerRecommendedStrategy({
      deployParams: [zetaTokenConsumerUniV3.address, zetaTokenNonEthAddress],
    });
  });

  describe("getZetaFromEth", () => {
    it("should get zeta from eth using UniV2", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV2.connect(randomSigner);

      const initialZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      await zetaTokenConsumer.getZetaFromEth(randomSigner.address, 1, { value: parseEther("1") });
      const finalZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      await expect(finalZetaBalance).to.be.gt(initialZetaBalance);
    });

    it("should get zeta from eth using UniV3", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV3.connect(randomSigner);

      const initialZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      await zetaTokenConsumer.getZetaFromEth(randomSigner.address, 1, { value: parseEther("1") });
      const finalZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      await expect(finalZetaBalance).to.be.gt(initialZetaBalance);
    });

    it("should get zeta from eth using recommended", async () => {
      const zetaTokenConsumer = zetaTokenConsumerRecommended.connect(randomSigner);

      const initialZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      await zetaTokenConsumer.getZetaFromEth(randomSigner.address, 1, { value: parseEther("1") });
      const finalZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      await expect(finalZetaBalance).to.be.gt(initialZetaBalance);
    });
  });

  describe("getZetaFromToken", () => {
    it("should get zeta from token using UniV2", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV2.connect(randomSigner);
      const USDCContract = IERC20__factory.connect(USDC, randomSigner);
      await swapToken(randomSigner, USDC, parseUnits("10000", 6));

      const initialZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      const tx1 = await USDCContract.approve(zetaTokenConsumer.address, MaxUint256);
      await tx1.wait();

      await zetaTokenConsumer.getZetaFromToken(randomSigner.address, 1, USDC, parseUnits("100", 6));
      const finalZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      await expect(finalZetaBalance).to.be.gt(initialZetaBalance);
    });

    it("should get zeta from token using UniV3", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV3.connect(randomSigner);
      const USDCContract = IERC20__factory.connect(USDC, randomSigner);
      await swapToken(randomSigner, USDC, parseUnits("10000", 6));

      const initialZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      const tx1 = await USDCContract.approve(zetaTokenConsumer.address, MaxUint256);
      await tx1.wait();

      await zetaTokenConsumer.getZetaFromToken(randomSigner.address, 1, USDC, parseUnits("100", 6));
      const finalZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      await expect(finalZetaBalance).to.be.gt(initialZetaBalance);
    });

    it("should get zeta from token using recommended", async () => {
      const zetaTokenConsumer = zetaTokenConsumerRecommended.connect(randomSigner);
      const USDCContract = IERC20__factory.connect(USDC, randomSigner);
      await swapToken(randomSigner, USDC, parseUnits("10000", 6));

      const initialZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      const tx1 = await USDCContract.approve(zetaTokenConsumer.address, MaxUint256);
      await tx1.wait();

      await zetaTokenConsumer.getZetaFromToken(randomSigner.address, 1, USDC, parseUnits("100", 6));
      const finalZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      await expect(finalZetaBalance).to.be.gt(initialZetaBalance);
    });
  });

  describe("getEthFromZeta", () => {
    it("should get eth from zeta using UniV2", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV2.connect(randomSigner);

      const initialZetaBalance = await ethers.provider.getBalance(randomSigner.address);
      const tx1 = await zetaTokenNonEth.connect(randomSigner).approve(zetaTokenConsumer.address, MaxUint256);
      await tx1.wait();

      await zetaTokenConsumer.getEthFromZeta(randomSigner.address, 1, parseUnits("5000", 18));
      const finalZetaBalance = await ethers.provider.getBalance(randomSigner.address);
      await expect(finalZetaBalance).to.be.gt(initialZetaBalance);
    });

    it("should get eth from zeta using UniV3", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV3.connect(randomSigner);

      const initialZetaBalance = await ethers.provider.getBalance(randomSigner.address);
      const tx1 = await zetaTokenNonEth.connect(randomSigner).approve(zetaTokenConsumer.address, MaxUint256);
      await tx1.wait();

      await zetaTokenConsumer.getEthFromZeta(randomSigner.address, 1, parseUnits("5000", 18));
      const finalZetaBalance = await ethers.provider.getBalance(randomSigner.address);
      await expect(finalZetaBalance).to.be.gt(initialZetaBalance);
    });

    it("should get eth from zeta using recommended", async () => {
      const zetaTokenConsumer = zetaTokenConsumerRecommended.connect(randomSigner);

      const initialZetaBalance = await ethers.provider.getBalance(randomSigner.address);
      const tx1 = await zetaTokenNonEth.connect(randomSigner).approve(zetaTokenConsumer.address, MaxUint256);
      await tx1.wait();

      await zetaTokenConsumer.getEthFromZeta(randomSigner.address, 1, parseUnits("5000", 18));
      const finalZetaBalance = await ethers.provider.getBalance(randomSigner.address);
      await expect(finalZetaBalance).to.be.gt(initialZetaBalance);
    });
  });

  describe("getTokenFromZeta", () => {
    it("should get token from zeta using UniV2", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV2.connect(randomSigner);
      const USDCContract = IERC20__factory.connect(USDC, randomSigner);

      const initialZetaBalance = await USDCContract.balanceOf(randomSigner.address);
      const tx1 = await zetaTokenNonEth.connect(randomSigner).approve(zetaTokenConsumer.address, MaxUint256);
      await tx1.wait();

      await zetaTokenConsumer.getTokenFromZeta(randomSigner.address, 1, USDC, parseUnits("5000", 18));
      const finalZetaBalance = await USDCContract.balanceOf(randomSigner.address);
      await expect(finalZetaBalance).to.be.gt(initialZetaBalance);
    });

    it("should get token from zeta using UniV3", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV3.connect(randomSigner);
      const USDCContract = IERC20__factory.connect(USDC, randomSigner);

      const initialZetaBalance = await USDCContract.balanceOf(randomSigner.address);
      const tx1 = await zetaTokenNonEth.connect(randomSigner).approve(zetaTokenConsumer.address, MaxUint256);
      await tx1.wait();

      await zetaTokenConsumer.getTokenFromZeta(randomSigner.address, 1, USDC, parseUnits("5000", 18));
      const finalZetaBalance = await USDCContract.balanceOf(randomSigner.address);
      await expect(finalZetaBalance).to.be.gt(initialZetaBalance);
    });

    it("should get token from zeta using recommended", async () => {
      const zetaTokenConsumer = zetaTokenConsumerRecommended.connect(randomSigner);
      const USDCContract = IERC20__factory.connect(USDC, randomSigner);

      const initialZetaBalance = await USDCContract.balanceOf(randomSigner.address);
      const tx1 = await zetaTokenNonEth.connect(randomSigner).approve(zetaTokenConsumer.address, MaxUint256);
      await tx1.wait();

      await zetaTokenConsumer.getTokenFromZeta(randomSigner.address, 1, USDC, parseUnits("5000", 18));
      const finalZetaBalance = await USDCContract.balanceOf(randomSigner.address);
      await expect(finalZetaBalance).to.be.gt(initialZetaBalance);
    });
  });
});
