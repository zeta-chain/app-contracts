import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  IERC20__factory,
  ImmutableCreate2Factory,
  ImmutableCreate2Factory__factory,
  ZetaEth__factory,
} from "@zetachain/interfaces/typechain-types";
import chai, { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import {
  buildBytecode,
  buildCreate2Address,
  deployContractToAddress,
  isDeployed,
  saltToHex,
} from "../lib/ImmutableCreate2Factory/ImmutableCreate2Factory.helpers";

chai.should();

describe("Deterministic deployment tests", () => {
  let immutableCreate2: ImmutableCreate2Factory;

  let accounts: SignerWithAddress[];
  let signer: SignerWithAddress;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [signer] = accounts;

    const immutableCreate2Factory = new ImmutableCreate2Factory__factory(signer);
    immutableCreate2 = await immutableCreate2Factory.deploy();
  });

  describe("Deploy zeta token with deterministic deployment", () => {
    it("Should deploy a contract", async () => {
      const salthex = saltToHex("hola", signer.address);
      const constructorTypes = ["uint256"];
      const constructorArgs = ["2100000000"];
      const contractBytecode = ZetaEth__factory.bytecode;

      const bytecode = buildBytecode(constructorTypes, constructorArgs, contractBytecode);
      const expectedAddress = await immutableCreate2.findCreate2Address(salthex, bytecode);

      // Deploy contract
      const { address } = await deployContractToAddress({
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

  it("Should deploy with leading zeros", async () => {
    let saltStr = "0";

    let minAddress = "0xfffffffffff";
    let minAddressSalt = "";
    for (let i = 0; i < 300; i++) {
      const salthex = saltToHex(saltStr, signer.address);
      const constructorTypes = ["uint256"];
      const constructorArgs = ["2100000000"];
      const contractBytecode = ZetaEth__factory.bytecode;

      const bytecode = buildBytecode(constructorTypes, constructorArgs, contractBytecode);
      const expectedAddress = buildCreate2Address(salthex, bytecode, immutableCreate2.address);
      if (expectedAddress < minAddress) {
        minAddress = expectedAddress;
        minAddressSalt = saltStr;
      }
      saltStr = i.toString();
    }

    expect(minAddress.substring(0, 4)).to.be.eq("0x00");
  });

  it("Should generate same address offchain and onchain", async () => {
    let saltStr = "0";

    const salthex = saltToHex(saltStr, signer.address);
    const constructorTypes = ["uint256"];
    const constructorArgs = ["2100000000"];
    const contractBytecode = ZetaEth__factory.bytecode;

    const bytecode = buildBytecode(constructorTypes, constructorArgs, contractBytecode);
    const expectedAddress = await immutableCreate2.findCreate2Address(salthex, bytecode);
    const expectedAddressOffchain = buildCreate2Address(salthex, bytecode, immutableCreate2.address);
    expect(expectedAddress.toLocaleLowerCase()).to.be.eq(expectedAddressOffchain);
  });
});
