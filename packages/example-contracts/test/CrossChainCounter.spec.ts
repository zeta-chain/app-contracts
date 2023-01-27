import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import {
  deployTestCrossChainCounter,
  deployZetaConnectorMock
} from "../lib/cross-chain-counter/CrossChainCounter.helpers";
import { CounterZetaConnectorMock, CrossChainCounter } from "../typechain-types";

describe("CrossChainCounter tests", () => {
  let crossChainCounterContractA: CrossChainCounter;
  const chainAId = 1;

  let crossChainCounterContractB: CrossChainCounter;
  const chainBId = 2;

  let zetaConnectorMockContract: CounterZetaConnectorMock;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let deployerAddress: string;

  const encoder = new ethers.utils.AbiCoder();

  beforeEach(async () => {
    zetaConnectorMockContract = await deployZetaConnectorMock();
    crossChainCounterContractA = await deployTestCrossChainCounter({
      zetaConnectorMockAddress: zetaConnectorMockContract.address
    });
    crossChainCounterContractB = await deployTestCrossChainCounter({
      zetaConnectorMockAddress: zetaConnectorMockContract.address
    });

    await crossChainCounterContractA.setInteractorByChainId(
      chainBId,
      ethers.utils.solidityPack(["address"], [crossChainCounterContractB.address])
    );
    await crossChainCounterContractB.setInteractorByChainId(
      chainAId,
      ethers.utils.solidityPack(["address"], [crossChainCounterContractA.address])
    );

    accounts = await ethers.getSigners();
    [deployer] = accounts;
    deployerAddress = deployer.address;
  });

  describe("crossChainCount", () => {
    it("Should revert if the cross chain address wasn't set", async () => {
      const unsetContract = await deployTestCrossChainCounter({
        zetaConnectorMockAddress: zetaConnectorMockContract.address
      });

      await expect(unsetContract.crossChainCount(chainAId)).to.be.revertedWith("InvalidDestinationChainId");
    });
  });

  describe("onZetaMessage", () => {
    it("Should revert if the caller is not the Connector contract", async () => {
      await expect(
        crossChainCounterContractA.onZetaMessage({
          destinationAddress: crossChainCounterContractB.address,
          message: encoder.encode(["address"], [deployerAddress]),
          sourceChainId: 1,
          zetaTxSenderAddress: ethers.utils.solidityPack(["address"], [crossChainCounterContractA.address]),
          zetaValue: 0
        })
      )
        .to.be.revertedWith("InvalidCaller")
        .withArgs(deployer.address);
    });

    it("Should revert if the cross-chain address doesn't match with the stored one", async () => {
      await expect(
        zetaConnectorMockContract.callOnZetaMessage(
          ethers.utils.solidityPack(["address"], [deployerAddress]),
          1,
          crossChainCounterContractB.address,
          0,
          encoder.encode(["address"], [zetaConnectorMockContract.address])
        )
      ).to.be.revertedWith("InvalidZetaMessageCall");
    });

    describe("Given a valid message", () => {
      it("Should increment the counter", async () => {
        const messageType = await crossChainCounterContractA.CROSS_CHAIN_INCREMENT_MESSAGE();

        const originalValue = await crossChainCounterContractB.counter(deployerAddress);
        expect(originalValue.toNumber()).to.equal(0);

        await (
          await zetaConnectorMockContract.callOnZetaMessage(
            ethers.utils.solidityPack(["address"], [crossChainCounterContractA.address]),
            1,
            crossChainCounterContractB.address,
            0,
            encoder.encode(["bytes32", "address"], [messageType, deployer.address])
          )
        ).wait();

        const newValue = await crossChainCounterContractB.counter(deployerAddress);
        expect(newValue.toNumber()).to.equal(1);
      });
    });
  });

  describe("onZetaRevert", () => {
    it("Should work", async () => {});
  });
});
