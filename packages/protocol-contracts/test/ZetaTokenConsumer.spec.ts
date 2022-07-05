import { MaxUint256 } from "@ethersproject/constants";
import { parseEther, parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getAddress } from "@zetachain/addresses";
import chai, { expect } from "chai";
import { ethers } from "hardhat";

import {
  deployZetaEth,
  deployZetaNonEth,
  getZetaTokenConsumerUniV2Strategy,
  getZetaTokenConsumerUniV3Strategy,
} from "../lib/contracts.helpers";
import {
  IERC20,
  IERC20__factory,
  ZetaTokenConsumer,
  ZetaTokenConsumerUniV2,
  ZetaTokenConsumerUniV3,
} from "../typechain-types";
import { addZetaEthLiquidityUniV2, swapToken } from "./uniswapV2.helpers";
import { createZetaEthPoolUniV2 } from "./uniswapV3.helpers";

chai.should();

describe("ZetaTokenConsumer tests", () => {
  let uniswapV2RouterAddress: string;
  let USDCAddr: string;

  let zetaTokenConsumerUniV2: ZetaTokenConsumerUniV2;
  let zetaTokenConsumerUniV3: ZetaTokenConsumerUniV3;
  let zetaTokenNonEthAddress: string;
  let zetaTokenNonEth: IERC20;
  let zetaTokenEth: IERC20;

  let accounts: SignerWithAddress[];
  let tssUpdater: SignerWithAddress;
  let tssSigner: SignerWithAddress;
  let randomSignerWithoutZeta: SignerWithAddress;
  let randomSignerWithZeta: SignerWithAddress;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [tssUpdater, tssSigner, randomSignerWithoutZeta, randomSignerWithZeta] = accounts;

    zetaTokenNonEth = await deployZetaNonEth({
      args: [tssSigner.address, tssUpdater.address],
    });

    zetaTokenEth = await deployZetaEth({
      args: [parseEther("10000000")],
    });

    uniswapV2RouterAddress = getAddress("uniswapV2Router02", {
      customNetworkName: "eth-mainnet",
      customZetaNetwork: "mainnet",
    });

    const UNI_QUOTER_V3 = getAddress("uniswapV3Quoter", {
      customNetworkName: "eth-mainnet",
      customZetaNetwork: "mainnet",
    });

    const UNI_ROUTER_V3 = getAddress("uniswapV3Router", {
      customNetworkName: "eth-mainnet",
      customZetaNetwork: "mainnet",
    });

    const UNI_NFT_MANAGER_V3 = getAddress("uniswapV3NftManager", {
      customNetworkName: "eth-mainnet",
      customZetaNetwork: "mainnet",
    });

    const UNI_FACTORY_V3 = getAddress("uniswapV3Factory", {
      customNetworkName: "eth-mainnet",
      customZetaNetwork: "mainnet",
    });

    const WETHAddress = getAddress("weth9", {
      customNetworkName: "eth-mainnet",
      customZetaNetwork: "mainnet",
    });

    USDCAddr = getAddress("usdc", {
      customNetworkName: "eth-mainnet",
      customZetaNetwork: "mainnet",
    });

    zetaTokenNonEthAddress = zetaTokenEth.address;
    zetaTokenNonEth = IERC20__factory.connect(zetaTokenNonEthAddress, tssSigner);

    zetaTokenConsumerUniV2 = await getZetaTokenConsumerUniV2Strategy({
      deployParams: [zetaTokenNonEthAddress, uniswapV2RouterAddress],
    });

    zetaTokenConsumerUniV3 = await getZetaTokenConsumerUniV3Strategy({
      deployParams: [zetaTokenNonEthAddress, UNI_ROUTER_V3, UNI_QUOTER_V3, WETHAddress, 3000, 3000],
    });

    await addZetaEthLiquidityUniV2({
      ETHToAdd: parseEther("500"),
      deployer: tssUpdater,
      uniswapRouterV2Address: uniswapV2RouterAddress,
      zetaToAdd: parseEther("1000"),
      zetaTokenAddress: zetaTokenEth.address,
    });

    await createZetaEthPoolUniV2({
      ETHToAdd: parseEther("500"),
      WETHAddress,
      deployer: tssUpdater,
      uniswapFactoryV3Address: UNI_FACTORY_V3,
      uniswapNFTManagerV3Address: UNI_NFT_MANAGER_V3,
      zetaToAdd: parseEther("1000"),
      zetaTokenAddress: zetaTokenEth.address,
    });

    zetaTokenEth.transfer(randomSignerWithZeta.address, parseEther("50000"));
  });

  describe("getZetaFromEth", () => {
    const shouldGetZetaFromETH = async (zetaTokenConsumer: ZetaTokenConsumer) => {
      const initialZetaBalance = await zetaTokenNonEth.balanceOf(randomSignerWithoutZeta.address);
      const tx = await zetaTokenConsumer.getZetaFromEth(randomSignerWithoutZeta.address, 1, { value: parseEther("1") });

      await tx.wait();

      const eventFilter = zetaTokenConsumer.filters.EthExchangedForZeta();
      const e1 = await zetaTokenConsumer.queryFilter(eventFilter);
      expect(e1.length).to.equal(1);
      expect(e1[0].transactionHash).to.equal(tx.hash);

      const finalZetaBalance = await zetaTokenNonEth.balanceOf(randomSignerWithoutZeta.address);
      expect(finalZetaBalance).to.be.gt(initialZetaBalance);
    };

    it("Should get zeta from eth using UniV2", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV2.connect(randomSignerWithoutZeta);
      await shouldGetZetaFromETH(zetaTokenConsumer);
    });

    it("Should get zeta from eth using UniV3", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV3.connect(randomSignerWithoutZeta);
      await shouldGetZetaFromETH(zetaTokenConsumer);
    });
  });

  describe("getZetaFromToken", () => {
    const shouldGetZetaFromToken = async (zetaTokenConsumer: ZetaTokenConsumer) => {
      const USDCContract = IERC20__factory.connect(USDCAddr, randomSignerWithoutZeta);
      await swapToken(randomSignerWithoutZeta, USDCAddr, uniswapV2RouterAddress, parseUnits("10000", 6));

      const initialZetaBalance = await zetaTokenNonEth.balanceOf(randomSignerWithoutZeta.address);
      const tx1 = await USDCContract.approve(zetaTokenConsumer.address, MaxUint256);
      await tx1.wait();

      const tx2 = await zetaTokenConsumer.getZetaFromToken(
        randomSignerWithoutZeta.address,
        1,
        USDCAddr,
        parseUnits("100", 6)
      );
      await tx2.wait();

      const eventFilter = zetaTokenConsumer.filters.TokenExchangedForZeta();
      const e1 = await zetaTokenConsumer.queryFilter(eventFilter);
      expect(e1.length).to.equal(1);
      expect(e1[0].transactionHash).to.equal(tx2.hash);

      const finalZetaBalance = await zetaTokenNonEth.balanceOf(randomSignerWithoutZeta.address);
      expect(finalZetaBalance).to.be.gt(initialZetaBalance);
    };

    it("Should get zeta from token using UniV2", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV2.connect(randomSignerWithoutZeta);
      await shouldGetZetaFromToken(zetaTokenConsumer);
    });

    it("Should get zeta from token using UniV3", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV3.connect(randomSignerWithoutZeta);
      await shouldGetZetaFromToken(zetaTokenConsumer);
    });
  });

  describe("getEthFromZeta", () => {
    const shouldGetETHFromZeta = async (zetaTokenConsumer: ZetaTokenConsumer) => {
      const initialEthBalance = await ethers.provider.getBalance(randomSignerWithZeta.address);
      const tx1 = await zetaTokenNonEth.connect(randomSignerWithZeta).approve(zetaTokenConsumer.address, MaxUint256);
      await tx1.wait();

      const tx2 = await zetaTokenConsumer.getEthFromZeta(randomSignerWithZeta.address, 1, parseUnits("50", 18));
      await tx2.wait();

      const eventFilter = zetaTokenConsumer.filters.ZetaExchangedForEth();
      const e1 = await zetaTokenConsumer.queryFilter(eventFilter);
      expect(e1.length).to.equal(1);
      expect(e1[0].transactionHash).to.equal(tx2.hash);

      const finalEthBalance = await ethers.provider.getBalance(randomSignerWithZeta.address);
      expect(finalEthBalance).to.be.gt(initialEthBalance);
    };

    it("Should get eth from zeta using UniV2", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV2.connect(randomSignerWithZeta);
      await shouldGetETHFromZeta(zetaTokenConsumer);
    });

    it("Should get eth from zeta using UniV3", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV3.connect(randomSignerWithZeta);

      await shouldGetETHFromZeta(zetaTokenConsumer);
    });
  });

  describe("getTokenFromZeta", () => {
    const shouldGetTokenFromZeta = async (zetaTokenConsumer: ZetaTokenConsumer) => {
      const USDCContract = IERC20__factory.connect(USDCAddr, randomSignerWithZeta);

      const initialTokenBalance = await USDCContract.balanceOf(randomSignerWithZeta.address);
      const tx1 = await zetaTokenNonEth.connect(randomSignerWithZeta).approve(zetaTokenConsumer.address, MaxUint256);
      await tx1.wait();

      const tx2 = await zetaTokenConsumer.getTokenFromZeta(
        randomSignerWithZeta.address,
        1,
        USDCAddr,
        parseUnits("50", 18)
      );
      await tx2.wait();

      const eventFilter = zetaTokenConsumer.filters.ZetaExchangedForToken();
      const e1 = await zetaTokenConsumer.queryFilter(eventFilter);
      expect(e1.length).to.equal(1);
      expect(e1[0].transactionHash).to.equal(tx2.hash);

      const finalTokenBalance = await USDCContract.balanceOf(randomSignerWithZeta.address);
      expect(finalTokenBalance).to.be.gt(initialTokenBalance);
    };

    it("Should get token from zeta using UniV2", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV2.connect(randomSignerWithZeta);
      await shouldGetTokenFromZeta(zetaTokenConsumer);
    });

    it("Should get token from zeta using UniV3", async () => {
      const zetaTokenConsumer = zetaTokenConsumerUniV3.connect(randomSignerWithZeta);
      await shouldGetTokenFromZeta(zetaTokenConsumer);
    });
  });
});
