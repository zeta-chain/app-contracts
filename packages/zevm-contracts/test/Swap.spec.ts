import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getAddress as getAddressLib } from "@zetachain/addresses";
import { expect } from "chai";
import { ethers } from "hardhat";
import { getSwapParams } from "../scripts/zeta-swap/helpers";
import { BigNumber } from "@ethersproject/bignumber";
import { ZetaSwap, ZetaSwap__factory } from "../typechain-types";

describe("ZetaSwap tests", () => {
  let zetaSwapContract: ZetaSwap;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [deployer] = accounts;
    const uniswapRouterAddr = getAddressLib({
      address: "uniswapV2Router02",
      networkName: "eth-mainnet",
      zetaNetwork: "mainnet"
    });
    const wGasToken = getAddressLib({
      address: "weth9",
      networkName: "eth-mainnet",
      zetaNetwork: "mainnet"
    });

    const Factory = (await ethers.getContractFactory("ZetaSwap")) as ZetaSwap__factory;

    zetaSwapContract = (await Factory.deploy(wGasToken, uniswapRouterAddr)) as ZetaSwap;

    await zetaSwapContract.deployed();
  });

  describe("zetaSwap", () => {
    it("Should do swap", async () => {
      //@todo: add test

      // const fakeZRC20 = accounts[1];
      // const fakeZRC20Destination = accounts[2];

      // const params = getSwapParams(fakeZRC20Destination.address, deployer.address, BigNumber.from('10'))

      // await zetaSwapContract.onCrossChainCall(fakeZRC20.address, 0, params);

      // await expect(unsetContract.crossChainCount(chainAId)).to.be.revertedWith("InvalidDestinationChainId()");
    });
  });
});
