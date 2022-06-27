import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import { deployZetaConnectorNonEth, deployZetaNonEth, deployZetaReceiverMock } from "../lib/contracts.helpers";
import { ZetaConnectorNonEth, ZetaNonEth, ZetaReceiverMock } from "../typechain-types";

describe("ZetaNonEth tests", () => {
  let zetaTokenNonEthContract: ZetaNonEth;
  let zetaReceiverMockContract: ZetaReceiverMock;
  let zetaConnectorNonEthContract: ZetaConnectorNonEth;
  let tssUpdater: SignerWithAddress;
  let tssSigner: SignerWithAddress;
  let randomSigner: SignerWithAddress;
  let pauserSigner: SignerWithAddress;

  const tssUpdaterApproveConnectorNonEth = async () => {
    await (await zetaTokenNonEthContract.approve(zetaConnectorNonEthContract.address, parseEther("100000"))).wait();
  };

  const mint100kZetaNonEth = async (transferTo: string) => {
    const zeta100k = parseEther("100000");

    await (
      await zetaConnectorNonEthContract
        .connect(tssSigner)
        .onReceive(randomSigner.address, 1, transferTo, zeta100k, [], ethers.constants.HashZero)
    ).wait();
  };

  const transfer100kZetaNonEth = async (transferTo: string) => {
    await mint100kZetaNonEth(tssUpdater.address);

    await (await zetaTokenNonEthContract.connect(tssUpdater).transfer(transferTo, 100_000)).wait();
  };

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    [tssUpdater, tssSigner, randomSigner, pauserSigner] = accounts;

    zetaTokenNonEthContract = await deployZetaNonEth({
      args: [tssSigner.address, tssUpdater.address],
    });

    zetaReceiverMockContract = await deployZetaReceiverMock();
    zetaConnectorNonEthContract = await deployZetaConnectorNonEth({
      args: [zetaTokenNonEthContract.address, tssSigner.address, tssUpdater.address, pauserSigner.address],
    });

    await zetaTokenNonEthContract.updateTssAndConnectorAddresses(
      tssSigner.address,
      zetaConnectorNonEthContract.address
    );

    await mint100kZetaNonEth(tssUpdater.address);
  });

  describe("updateTssAndConnectorAddresses", () => {
    it("Should revert if the caller is not tssAddressUpdater", async () => {
      expect(
        zetaTokenNonEthContract
          .connect(randomSigner)
          .updateTssAndConnectorAddresses(tssSigner.address, zetaConnectorNonEthContract.address)
      ).to.be.revertedWith(`CallerIsNotTssUpdater("${randomSigner.address}")`);
    });

    it("Should change the addresses if the caller is tssAddressUpdater", async () => {
      await (
        await zetaTokenNonEthContract.updateTssAndConnectorAddresses(randomSigner.address, randomSigner.address)
      ).wait();

      expect(await zetaTokenNonEthContract.tssAddress()).to.equal(randomSigner.address);
      expect(await zetaTokenNonEthContract.connectorAddress()).to.equal(randomSigner.address);
    });
  });

  describe("renounceTssAddressUpdater", () => {
    it("Should revert if the caller is not tssAddressUpdater", async () => {
      expect(zetaTokenNonEthContract.connect(randomSigner).renounceTssAddressUpdater()).to.be.revertedWith(
        `CallerIsNotTssUpdater("${randomSigner.address}")`
      );
    });

    it("Should change tssAddressUpdater to tssAddress if the caller is tssAddressUpdater", async () => {
      await (await zetaTokenNonEthContract.renounceTssAddressUpdater()).wait();

      expect(await zetaTokenNonEthContract.tssAddressUpdater()).to.equal(tssSigner.address);
    });
  });

  describe("mint", () => {
    it("Should revert if the caller is not the Connector contract", async () => {
      expect(
        zetaTokenNonEthContract.connect(randomSigner).mint(tssUpdater.address, 100_000, ethers.constants.AddressZero)
      ).to.be.revertedWith(`CallerIsNotConnector("${randomSigner.address}")`);
    });

    it("Should emit `Minted` on success", async () => {
      const zetaMintedFilter = zetaTokenNonEthContract.filters.Minted();
      const e1 = await zetaTokenNonEthContract.queryFilter(zetaMintedFilter);
      expect(e1.length).to.equal(1);

      await (
        await zetaConnectorNonEthContract
          .connect(tssSigner)
          .onReceive(
            randomSigner.address,
            1,
            zetaReceiverMockContract.address,
            1000,
            new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            ethers.constants.HashZero
          )
      ).wait();

      const e2 = await zetaTokenNonEthContract.queryFilter(zetaMintedFilter);
      expect(e2.length).to.equal(2);
    });
  });

  describe("burnFrom", () => {
    it("Should revert if the caller is not the Connector contract", async () => {
      expect(zetaTokenNonEthContract.connect(randomSigner).burnFrom(tssUpdater.address, 100_000)).to.be.revertedWith(
        `CallerIsNotConnector("${randomSigner.address}")`
      );
    });

    it("Should emit `Burnt` on success", async () => {
      await tssUpdaterApproveConnectorNonEth();
      const zetaBurntFilter = zetaTokenNonEthContract.filters.Burnt();
      const e1 = await zetaTokenNonEthContract.queryFilter(zetaBurntFilter);
      expect(e1.length).to.equal(0);

      await zetaConnectorNonEthContract.send({
        destinationAddress: randomSigner.address,
        destinationChainId: 1,
        destinationGasLimit: 2500000,
        message: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
        zetaValueAndGas: 1000,
        zetaParams: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
      });

      const e2 = await zetaTokenNonEthContract.queryFilter(zetaBurntFilter);
      expect(e2.length).to.equal(1);
    });
  });
});
