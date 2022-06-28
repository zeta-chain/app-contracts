import { MaxUint256 } from "@ethersproject/constants";
import { parseEther, parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getAddress } from "@zetachain/addresses";
import chai, { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

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
  UniswapV2Router02__factory,
  ZetaTokenConsumer,
  ZetaTokenConsumerRecommended,
  ZetaTokenConsumerUniV2,
  ZetaTokenConsumerUniV3,
} from "../typechain-types";
import { parseZetaConsumerLog } from "./test.helpers";
import { DAI, UNI_NFT_MANAGER_V3, UNI_QUOTER_V3, UNI_ROUTER_V3, USDC, WETH9 } from "./ZetaTokenConsumer.constants";

chai.should();

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

  /**
   * @todo (andy): WIP, not in use yet
   */
  const createPoolV3 = async (signer: SignerWithAddress, tokenAddress: string) => {
    await swapToken(signer, DAI, parseUnits("10000", 18));

    const token = IERC20__factory.connect(USDC, signer);
    const tx1 = await token.approve(UNI_NFT_MANAGER_V3, MaxUint256);
    await tx1.wait();

    const token2 = IERC20__factory.connect(DAI, signer);
    const tx2 = await token2.approve(UNI_NFT_MANAGER_V3, MaxUint256);
    await tx2.wait();

    const uniswapRouter = INonfungiblePositionManager__factory.connect(UNI_NFT_MANAGER_V3, signer);

    const uniswapNFTManager = IPoolInitializer__factory.connect(UNI_NFT_MANAGER_V3, signer);
    const tx3 = await uniswapNFTManager.createAndInitializePoolIfNecessary(
      USDC,
      DAI,
      3000,
      "80000000000000000000000000000"
    );
    await tx3.wait();

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

    const tx4 = await uniswapRouter.mint(params);
    await tx4.wait();
  };

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [tssUpdater, tssSigner, randomSigner] = accounts;

    zetaTokenNonEth = await deployZetaNonEth({
      args: [tssSigner.address, tssUpdater.address],
    });

    uniswapV2RouterAddr = getAddress("uniswapV2Router02", {
      customNetworkName: "eth-mainnet",
      customZetaNetwork: "mainnet",
    });

    // For testing purposes we use an existing uni v3 pool
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
      deployParams: [zetaTokenNonEthAddress, uniswapV3RouterAddr, UNI_QUOTER_V3, WETH9],
    });

    zetaTokenConsumerRecommended = await getZetaTokenConsumerRecommendedStrategy({
      deployParams: [zetaTokenConsumerUniV3.address, zetaTokenNonEthAddress, tssSigner.address, tssUpdater.address],
    });
  });

  describe("getZetaFromEth", () => {
    const shouldGetZetaFromETH = async (zetaTokenConsumer: ZetaTokenConsumer) => {
      const initialZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      const tx = await zetaTokenConsumer.getZetaFromEth(randomSigner.address, 1, { value: parseEther("1") });

      const result = await tx.wait();
      const eventNames = parseZetaConsumerLog(result.logs);
      expect(eventNames.filter((e) => e === "EthExchangedForZeta")).to.have.lengthOf(1);

      const finalZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      expect(finalZetaBalance).to.be.gt(initialZetaBalance);
    };

    it("Should get zeta from eth using UniV2", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV2.connect(randomSigner);
      await shouldGetZetaFromETH(zetaTokenConsumer);
    });

    it("Should get zeta from eth using UniV3", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV3.connect(randomSigner);
      await shouldGetZetaFromETH(zetaTokenConsumer);
    });

    it("Should get zeta from eth using recommended", async () => {
      const zetaTokenConsumer = zetaTokenConsumerRecommended.connect(randomSigner);
      await shouldGetZetaFromETH(zetaTokenConsumer);
    });
  });

  describe("getZetaFromToken", () => {
    const shouldGetZetaFromToken = async (zetaTokenConsumer: ZetaTokenConsumer) => {
      const USDCContract = IERC20__factory.connect(USDC, randomSigner);
      await swapToken(randomSigner, USDC, parseUnits("10000", 6));

      const initialZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      const tx1 = await USDCContract.approve(zetaTokenConsumer.address, MaxUint256);
      await tx1.wait();

      const tx2 = await zetaTokenConsumer.getZetaFromToken(randomSigner.address, 1, USDC, parseUnits("100", 6));
      const result = await tx2.wait();

      const eventNames = parseZetaConsumerLog(result.logs);
      expect(eventNames.filter((e) => e === "TokenExchangedForZeta")).to.have.lengthOf(1);

      const finalZetaBalance = await zetaTokenNonEth.balanceOf(randomSigner.address);
      expect(finalZetaBalance).to.be.gt(initialZetaBalance);
    };

    it("Should get zeta from token using UniV2", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV2.connect(randomSigner);
      await shouldGetZetaFromToken(zetaTokenConsumer);
    });

    it("Should get zeta from token using UniV3", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV3.connect(randomSigner);
      await shouldGetZetaFromToken(zetaTokenConsumer);
    });

    it("Should get zeta from token using recommended", async () => {
      const zetaTokenConsumer = zetaTokenConsumerRecommended.connect(randomSigner);
      await shouldGetZetaFromToken(zetaTokenConsumer);
    });
  });

  describe("getEthFromZeta", () => {
    const shouldGetETHFromZeta = async (zetaTokenConsumer: ZetaTokenConsumer) => {
      const initialEthBalance = await ethers.provider.getBalance(randomSigner.address);
      const tx1 = await zetaTokenNonEth.connect(randomSigner).approve(zetaTokenConsumer.address, MaxUint256);
      await tx1.wait();

      const tx2 = await zetaTokenConsumer.getEthFromZeta(randomSigner.address, 1, parseUnits("5000", 18));
      const result = await tx2.wait();

      const eventNames = parseZetaConsumerLog(result.logs);
      expect(eventNames.filter((e) => e === "ZetaExchangedForEth")).to.have.lengthOf(1);

      const finalEthBalance = await ethers.provider.getBalance(randomSigner.address);
      expect(finalEthBalance).to.be.gt(initialEthBalance);
    };

    it("Should get eth from zeta using UniV2", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV2.connect(randomSigner);
      await shouldGetETHFromZeta(zetaTokenConsumer);
    });

    it("Should get eth from zeta using UniV3", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV3.connect(randomSigner);

      await shouldGetETHFromZeta(zetaTokenConsumer);
    });

    it("Should get eth from zeta using recommended", async () => {
      const zetaTokenConsumer = zetaTokenConsumerRecommended.connect(randomSigner);
      await shouldGetETHFromZeta(zetaTokenConsumer);
    });
  });

  describe("getTokenFromZeta", () => {
    const shouldGetTokenFromZeta = async (zetaTokenConsumer: ZetaTokenConsumer) => {
      const USDCContract = IERC20__factory.connect(USDC, randomSigner);

      const initialTokenBalance = await USDCContract.balanceOf(randomSigner.address);
      const tx1 = await zetaTokenNonEth.connect(randomSigner).approve(zetaTokenConsumer.address, MaxUint256);
      await tx1.wait();

      const tx2 = await zetaTokenConsumer.getTokenFromZeta(randomSigner.address, 1, USDC, parseUnits("5000", 18));
      const result = await tx2.wait();

      const eventNames = parseZetaConsumerLog(result.logs);
      expect(eventNames.filter((e) => e === "ZetaExchangedForToken")).to.have.lengthOf(1);

      const finalTokenBalance = await USDCContract.balanceOf(randomSigner.address);
      expect(finalTokenBalance).to.be.gt(initialTokenBalance);
    };

    it("Should get token from zeta using UniV2", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV2.connect(randomSigner);
      await shouldGetTokenFromZeta(zetaTokenConsumer);
    });

    it("Should get token from zeta using UniV3", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV3.connect(randomSigner);
      await shouldGetTokenFromZeta(zetaTokenConsumer);
    });

    it("Should get token from zeta using recommended", async () => {
      const zetaTokenConsumer = zetaTokenConsumerRecommended.connect(randomSigner);
      await shouldGetTokenFromZeta(zetaTokenConsumer);
    });
  });
});
