import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getAddress as getAddressLib } from "@zetachain/addresses";
import { expect } from "chai";
import { ethers } from "hardhat";
import { encodeParams, getSwapParams } from "../scripts/zeta-swap/helpers";
import { BigNumber } from "@ethersproject/bignumber";
import { ZetaSwap, ZetaSwap__factory } from "../typechain-types";
import { utils } from "ethers";
import { ZetaSwapBTC__factory } from "../typechain-types/factories/contracts/zeta-swap/ZetaSwapBTC__factory";
import { ZetaSwapBTC } from "../typechain-types/contracts/zeta-swap/ZetaSwapBTC";

describe("ZetaSwap tests", () => {
  let zetaSwapContract: ZetaSwap;
  let zetaSwapBTCContract: ZetaSwapBTC;

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

    const FactoryBTC = (await ethers.getContractFactory("ZetaSwapBTC")) as ZetaSwapBTC__factory;
    zetaSwapBTCContract = (await FactoryBTC.deploy(wGasToken, uniswapRouterAddr)) as ZetaSwapBTC;
    await zetaSwapBTCContract.deployed();

  });

  const encodeAddressArray = (addresses: string[]) => {
    let hex = "0x";
    hex += addresses.map(address => address.substr(2, 40)).join("");

    return ethers.utils.arrayify(hex);
}

  describe("zetaSwap", () => {
    it("Should do swap", async () => {
      //@todo: add test

      const fakeZRC20 = accounts[1];
      const fakeZRC20Destination = accounts[2];

      // const params = getSwapParams(fakeZRC20Destination.address, deployer.address, BigNumber.from('10'))

    //   (address targetZRC20, bytes32 receipient, uint256 minAmountOut) = abi.decode(
    //     message,
    //     (address, bytes32, uint256)
    // );

      // const b1 = utils.parseBytes32String('0x91aefa62b07be50179f355b79afc327ca99d7776000000000000000000000000d97b1de3619ed2c6beb3860147e30ca8a7dc989100000000000000000000000025a92a5853702f199bb2d805bba05d67025214a80000000000000000000000000000000000000000000000000000000000000000')
      
      // const abiCoder = ethers.utils.defaultAbiCoder;

      // const params = abiCoder.encode(["address", "address", "uint256"], [fakeZRC20.address, fakeZRC20Destination.address, 10]);
      // console.log(params)

      const p1 = encodeAddressArray([fakeZRC20.address, fakeZRC20Destination.address])
      zetaSwapBTCContract.onCrossChainCall(fakeZRC20.address, 0, p1)

      // await zetaSwapContract.onCrossChainCall(fakeZRC20.address, 0, params);

      // await expect(unsetContract.crossChainCount(chainAId)).to.be.revertedWith("InvalidDestinationChainId()");
    });
  });
});
