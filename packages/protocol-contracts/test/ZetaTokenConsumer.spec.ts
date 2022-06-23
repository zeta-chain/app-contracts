import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getAddress } from "@zetachain/addresses";
import chai from "chai";
import { ethers } from "hardhat";

import {
  deployZetaNonEth,
  getZetaTokenConsumerMock,
  getZetaTokenConsumerUniV2Strategy,
} from "../lib/contracts.helpers";
import {
  IUniswapV2Router02,
  UniswapV2Router02__factory,
  ZetaNonEth,
  ZetaTokenConsumerMock,
  ZetaTokenConsumerUniV2,
} from "../typechain-types";

chai.should();

describe.only("ZetaTokenConsumer tests", () => {
  let zetaTokenConsumerUniV2: ZetaTokenConsumerUniV2;
  let zetaTokenConsumerMock: ZetaTokenConsumerMock;
  let zetaTokenNonEth: ZetaNonEth;
  let uniswapRouterFork: IUniswapV2Router02;

  let accounts: SignerWithAddress[];
  let tssUpdater: SignerWithAddress;
  let tssSigner: SignerWithAddress;
  let randomSigner: SignerWithAddress;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [tssUpdater, tssSigner, randomSigner] = accounts;

    zetaTokenNonEth = await deployZetaNonEth({
      args: [100_000, tssSigner.address, tssUpdater.address],
    });

    const uniswapRouterAddr = getAddress("uniswapV2Router02", {
      customNetworkName: "eth-mainnet",
      customZetaNetwork: "mainnet",
    });
    const uniswapRouterFactory = new UniswapV2Router02__factory(tssUpdater);
    uniswapRouterFork = uniswapRouterFactory.attach(uniswapRouterAddr);

    zetaTokenConsumerUniV2 = await getZetaTokenConsumerUniV2Strategy({
      deployParams: [zetaTokenNonEth.address, uniswapRouterFork.address],
    });
    zetaTokenConsumerMock = await getZetaTokenConsumerMock(zetaTokenConsumerUniV2.address);
  });

  describe("getZetaFromEth", () => {
    //
  });

  describe("getZetaFromToken", () => {
    //
  });

  describe("getEthFromZeta", () => {
    //
  });

  describe("getTokenFromZeta", () => {
    //
  });
});
