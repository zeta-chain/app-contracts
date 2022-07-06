import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai, { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import {
  IERC20__factory,
  ImmutableCreate2Factory,
  ImmutableCreate2Factory__factory,
  ZetaEth__factory,
} from "../typechain-types";
import { deployContract, isDeployed } from "./deterministicDeployment.index.utils";
import { buildBytecode, saltToHex } from "./deterministicDeployment.utils";

chai.should();

describe("ZetaTokenConsumer tests", () => {
  let immutableCreate2: ImmutableCreate2Factory;

  let accounts: SignerWithAddress[];
  let signer: SignerWithAddress;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [signer] = accounts;

    const immutableCreate2Factory = new ImmutableCreate2Factory__factory(signer);
    immutableCreate2 = await immutableCreate2Factory.deploy();
  });

  describe("getZetaFromEth", () => {
    it("Should deploy a contract", async () => {
      const salthex = saltToHex("hola", signer.address);
      const constructorTypes = ["uint256"];
      const constructorArgs = ["2100000000"];
      const contractBytecode = ZetaEth__factory.bytecode;

      const bytecode = buildBytecode(constructorTypes, constructorArgs, contractBytecode);
      const expectedAddress = await immutableCreate2.findCreate2Address(salthex, bytecode);

      // Deploy contract
      const { address } = await deployContract({
        constructorArgs: constructorArgs,
        constructorTypes: constructorTypes,
        contractBytecode: ZetaEth__factory.bytecode,
        factoryAddress: immutableCreate2.address,
        salt: salthex,
        signer: signer,
      });

      expect(address).to.be.eq(expectedAddress);

      // Query if contract deployed at address
      const success = await isDeployed(address, ethers.provider);
      expect(success).to.be.true;

      const token = IERC20__factory.connect(address, signer);
      const totalSup = await token.totalSupply();
      expect(totalSup.toString()).to.be.eq(parseEther(constructorArgs[0]));
    });
  });
});
