import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getAddress as getAddressLib } from "@zetachain/addresses";
import { expect } from "chai";
import { ethers } from "hardhat";

import { ZetaSwap, ZetaSwap__factory } from "../typechain-types";

const encodeParams = (dataTypes: any[], data: any[]) => {
  // const encoder = new ethers.utils.AbiCoder();
  const abiCoder = ethers.utils.defaultAbiCoder;
  return abiCoder.encode(dataTypes, data);
};

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
      const fakeZRC20 = accounts[1];
      const fakeZRC20Destination = accounts[2];

      const paddedDestination = ethers.utils.hexlify(ethers.utils.zeroPad(deployer.address, 32));
      const params = encodeParams(
        ["address", "bytes32", "uint256"],
        [fakeZRC20Destination.address, paddedDestination, 10]
      );

      console.log("ts>", fakeZRC20Destination.address, deployer.address);
      await zetaSwapContract.onCrossChainCall(fakeZRC20.address, 0, params);

      // await expect(unsetContract.crossChainCount(chainAId)).to.be.revertedWith("InvalidDestinationChainId()");
    });
  });
});
