import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import {
  deployZetaConnectorBase,
  deployZetaConnectorEth,
  deployZetaConnectorNonEth,
  deployZetaEth,
  deployZetaNonEth,
  deployZetaReceiverMock,
} from "../lib/contracts.helpers";
import {
  ZetaConnectorBase,
  ZetaConnectorEth,
  ZetaConnectorNonEth,
  ZetaEth,
  ZetaNonEth,
  ZetaReceiverMock,
} from "../typechain-types";

describe("ZetaConnector tests", () => {
  let zetaTokenEthContract: ZetaEth;
  let zetaTokenNonEthContract: ZetaNonEth;
  let zetaConnectorBaseContract: ZetaConnectorBase;
  let zetaConnectorEthContract: ZetaConnectorEth;
  let zetaReceiverMockContract: ZetaReceiverMock;
  let zetaConnectorNonEthContract: ZetaConnectorNonEth;
  let tssUpdater: SignerWithAddress;
  let tssSigner: SignerWithAddress;
  let randomSigner: SignerWithAddress;

  const tssUpdaterApproveConnectorEth = async () => {
    await (await zetaTokenEthContract.approve(zetaConnectorEthContract.address, 100_000)).wait();
  };

  const tssUpdaterApproveConnectorNonEth = async () => {
    await (await zetaTokenNonEthContract.approve(zetaConnectorNonEthContract.address, 100_000)).wait();
  };

  const transfer100kZetaEth = async (transferTo: string) => {
    await (await zetaTokenEthContract.transfer(transferTo, 100_000)).wait();
  };

  const transfer100kZetaNonEth = async (transferTo: string) => {
    await (await zetaTokenNonEthContract.transfer(transferTo, 100_000)).wait();
  };

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    [tssUpdater, tssSigner, randomSigner] = accounts;

    zetaTokenEthContract = await deployZetaEth({
      args: [100_000],
    });

    zetaTokenNonEthContract = await deployZetaNonEth({
      args: [100_000, tssSigner.address, tssUpdater.address],
    });

    zetaReceiverMockContract = await deployZetaReceiverMock();
    zetaConnectorBaseContract = await deployZetaConnectorBase({
      args: [zetaTokenEthContract.address, tssSigner.address, tssUpdater.address],
    });
    zetaConnectorEthContract = await deployZetaConnectorEth({
      args: [zetaTokenEthContract.address, tssSigner.address, tssUpdater.address],
    });
    zetaConnectorNonEthContract = await deployZetaConnectorNonEth({
      args: [zetaTokenNonEthContract.address, tssSigner.address, tssUpdater.address],
    });

    await zetaTokenNonEthContract.updateTSSAndConnectorAddresses(
      tssSigner.address,
      zetaConnectorNonEthContract.address
    );
  });

  describe("ZetaConnector.base", () => {
    describe("updateTssAddress", () => {
      it("Should revert if the caller is not the TSS updater", async () => {
        await expect(
          zetaConnectorBaseContract.connect(randomSigner).updateTssAddress(randomSigner.address)
        ).to.revertedWith("ZetaConnector: only TSS updater can call this function");
      });

      it("Should revert if the new TSS address is invalid", async () => {
        await expect(
          zetaConnectorBaseContract.updateTssAddress("0x0000000000000000000000000000000000000000")
        ).to.revertedWith("ZetaConnector: invalid tssAddress");
      });

      it("Should change the TSS address if called by TSS updater", async () => {
        await (await zetaConnectorBaseContract.updateTssAddress(randomSigner.address)).wait();

        const address = await zetaConnectorBaseContract.tssAddress();

        expect(address).to.equal(randomSigner.address);
      });
    });

    describe("pause, unpause", () => {
      it("Should revert if not called by the TSS updater", async () => {
        await expect(zetaConnectorBaseContract.connect(randomSigner).pause()).to.revertedWith(
          "ZetaConnector: only TSS updater can call this function"
        );

        await expect(zetaConnectorBaseContract.connect(randomSigner).unpause()).to.revertedWith(
          "ZetaConnector: only TSS updater can call this function"
        );
      });

      it("Should pause if called by the TSS updater", async () => {
        await (await zetaConnectorBaseContract.pause()).wait();
        const paused1 = await zetaConnectorBaseContract.paused();
        expect(paused1).to.equal(true);

        await (await zetaConnectorBaseContract.unpause()).wait();
        const paused2 = await zetaConnectorBaseContract.paused();
        expect(paused2).to.equal(false);
      });
    });
  });

  describe("ZetaConnector.eth", () => {
    describe("send", () => {
      it("Should revert if the contract is paused", async () => {
        await (await zetaConnectorEthContract.pause()).wait();
        const paused1 = await zetaConnectorEthContract.paused();
        expect(paused1).to.equal(true);

        await expect(
          zetaConnectorEthContract.send({
            destinationAddress: randomSigner.address,
            destinationChainId: 1,
            gasLimit: 2500000,
            message: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            zetaAmount: 1000,
            zetaParams: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
          })
        ).to.revertedWith("Pausable: paused");
      });

      it("Should revert if the sender has no enough zeta", async () => {
        await (
          await zetaTokenEthContract.connect(randomSigner).approve(zetaConnectorEthContract.address, 100_000)
        ).wait();

        await expect(
          zetaConnectorEthContract.connect(randomSigner).send({
            destinationAddress: randomSigner.address,
            destinationChainId: 1,
            gasLimit: 2500000,
            message: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            zetaAmount: 1000,
            zetaParams: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
          })
        ).to.revertedWith("ERC20: transfer amount exceeds balance");
      });

      it("Should revert if the sender didn't allow ZetaConnector to spend Zeta token", async () => {
        await expect(
          zetaConnectorEthContract.send({
            destinationAddress: randomSigner.address,
            destinationChainId: 1,
            gasLimit: 2500000,
            message: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            zetaAmount: 1000,
            zetaParams: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
          })
        ).to.revertedWith("ERC20: insufficient allowance");
      });

      it("Should transfer Zeta token from the sender account to the Connector contract", async () => {
        const initialBalanceDeployer = await zetaTokenEthContract.balanceOf(tssUpdater.address);
        const initialBalanceConnector = await zetaTokenEthContract.balanceOf(zetaConnectorEthContract.address);

        expect(initialBalanceDeployer.toString()).to.equal("100000000000000000000000");
        expect(initialBalanceConnector.toString()).to.equal("0");

        await tssUpdaterApproveConnectorEth();

        await (
          await zetaConnectorEthContract.send({
            destinationAddress: randomSigner.address,
            destinationChainId: 1,
            gasLimit: 2500000,
            message: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            zetaAmount: 1000,
            zetaParams: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
          })
        ).wait();

        const finalBalanceDeployer = await zetaTokenEthContract.balanceOf(tssUpdater.address);
        const finalBalanceConnector = await zetaTokenEthContract.balanceOf(zetaConnectorEthContract.address);

        expect(finalBalanceDeployer.toString()).to.equal("99999999999999999999000");
        expect(finalBalanceConnector.toString()).to.equal("1000");
      });

      it("Should emit `ZetaSent` on success", async () => {
        const zetaSentFilter = zetaConnectorEthContract.filters.ZetaSent();
        const e1 = await zetaConnectorEthContract.queryFilter(zetaSentFilter);
        expect(e1.length).to.equal(0);

        await zetaConnectorEthContract.send({
          destinationAddress: randomSigner.address,
          destinationChainId: 1,
          gasLimit: 2500000,
          message: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
          zetaAmount: 0,
          zetaParams: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
        });

        const e2 = await zetaConnectorEthContract.queryFilter(zetaSentFilter);
        expect(e2.length).to.equal(1);
      });
    });

    describe("onReceive", () => {
      it("Should revert if the contract is paused", async () => {
        await (await zetaConnectorEthContract.pause()).wait();
        const paused1 = await zetaConnectorEthContract.paused();
        expect(paused1).to.equal(true);

        await expect(
          zetaConnectorEthContract.onReceive(
            tssUpdater.address,
            1,
            randomSigner.address,
            1000,
            new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          )
        ).to.revertedWith("Pausable: paused");
      });

      it("Should revert if not called by TSS address", async () => {
        await expect(
          zetaConnectorEthContract.onReceive(
            tssUpdater.address,
            1,
            randomSigner.address,
            1000,
            new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          )
        ).to.revertedWith("ZetaConnector: only TSS address can call this function");
      });

      it("Should revert if Zeta transfer fails", async () => {
        await expect(
          zetaConnectorEthContract
            .connect(tssSigner)
            .onReceive(
              randomSigner.address,
              1,
              randomSigner.address,
              1000,
              new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
              "0x0000000000000000000000000000000000000000000000000000000000000000"
            )
        ).to.revertedWith("ERC20: transfer amount exceeds balance");
      });

      it("Should transfer to the receiver address", async () => {
        await transfer100kZetaEth(zetaConnectorEthContract.address);

        const initialBalanceConnector = await zetaTokenEthContract.balanceOf(zetaConnectorEthContract.address);
        const initialBalanceReceiver = await zetaTokenEthContract.balanceOf(zetaReceiverMockContract.address);
        expect(initialBalanceConnector.toString()).to.equal("100000");
        expect(initialBalanceReceiver.toString()).to.equal("0");

        await (
          await zetaConnectorEthContract
            .connect(tssSigner)
            .onReceive(
              randomSigner.address,
              1,
              zetaReceiverMockContract.address,
              1000,
              new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
              "0x0000000000000000000000000000000000000000000000000000000000000000"
            )
        ).wait();

        const finalBalanceConnector = await zetaTokenEthContract.balanceOf(zetaConnectorEthContract.address);
        const finalBalanceReceiver = await zetaTokenEthContract.balanceOf(zetaReceiverMockContract.address);

        expect(finalBalanceConnector.toString()).to.equal("99000");
        expect(finalBalanceReceiver.toString()).to.equal("1000");
      });

      it("Should emit `ZetaReceived` on success", async () => {
        await transfer100kZetaEth(zetaConnectorEthContract.address);

        const zetaReceivedFilter = zetaConnectorEthContract.filters.ZetaReceived();
        const e1 = await zetaConnectorEthContract.queryFilter(zetaReceivedFilter);
        expect(e1.length).to.equal(0);

        await (
          await zetaConnectorEthContract
            .connect(tssSigner)
            .onReceive(
              randomSigner.address,
              1,
              zetaReceiverMockContract.address,
              1000,
              new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
              "0x0000000000000000000000000000000000000000000000000000000000000000"
            )
        ).wait();

        const e2 = await zetaConnectorEthContract.queryFilter(zetaReceivedFilter);
        expect(e2.length).to.equal(1);
      });
    });

    describe("onRevert", () => {
      it("Should revert if the contract is paused", async () => {
        await (await zetaConnectorEthContract.pause()).wait();
        const paused1 = await zetaConnectorEthContract.paused();
        expect(paused1).to.equal(true);

        await expect(
          zetaConnectorEthContract.onRevert(
            randomSigner.address,
            1,
            randomSigner.address,
            2,
            1000,
            new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          )
        ).to.revertedWith("Pausable: paused");
      });

      it("Should revert if not called by TSS address", async () => {
        await expect(
          zetaConnectorEthContract.onRevert(
            randomSigner.address,
            1,
            tssUpdater.address,
            1,
            1000,
            new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          )
        ).to.revertedWith("ZetaConnector: only TSS address can call this function");
      });

      it("Should transfer to the origin address", async () => {
        await transfer100kZetaEth(zetaConnectorEthContract.address);

        const initialBalanceConnector = await zetaTokenEthContract.balanceOf(zetaConnectorEthContract.address);
        const initialBalanceSender = await zetaTokenEthContract.balanceOf(zetaReceiverMockContract.address);
        expect(initialBalanceConnector.toString()).to.equal("100000");
        expect(initialBalanceSender.toString()).to.equal("0");

        await (
          await zetaConnectorEthContract
            .connect(tssSigner)
            .onRevert(
              zetaReceiverMockContract.address,
              1,
              randomSigner.address,
              1,
              1000,
              new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
              "0x0000000000000000000000000000000000000000000000000000000000000000"
            )
        ).wait();

        const finalBalanceConnector = await zetaTokenEthContract.balanceOf(zetaConnectorEthContract.address);
        const finalBalanceSender = await zetaTokenEthContract.balanceOf(zetaReceiverMockContract.address);

        expect(finalBalanceConnector.toString()).to.equal("99000");
        expect(finalBalanceSender.toString()).to.equal("1000");
      });

      it("Should emit `ZetaReverted` on success", async () => {
        await transfer100kZetaEth(zetaConnectorEthContract.address);

        const zetaRevertedFilter = zetaConnectorEthContract.filters.ZetaReverted();
        const e1 = await zetaConnectorEthContract.queryFilter(zetaRevertedFilter);
        expect(e1.length).to.equal(0);

        await (
          await zetaConnectorEthContract
            .connect(tssSigner)
            .onRevert(
              zetaReceiverMockContract.address,
              1,
              randomSigner.address,
              1,
              1000,
              new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
              "0x0000000000000000000000000000000000000000000000000000000000000000"
            )
        ).wait();

        const e2 = await zetaConnectorEthContract.queryFilter(zetaRevertedFilter);
        expect(e2.length).to.equal(1);
      });
    });
  });

  describe("ZetaConnector.non-eth", () => {
    describe("send", () => {
      it("Should revert if the contract is paused", async () => {
        await (await zetaConnectorNonEthContract.pause()).wait();
        const paused1 = await zetaConnectorNonEthContract.paused();
        expect(paused1).to.equal(true);

        await expect(
          zetaConnectorNonEthContract.send({
            destinationAddress: randomSigner.address,
            destinationChainId: 1,
            gasLimit: 2500000,
            message: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            zetaAmount: 1000,
            zetaParams: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
          })
        ).to.revertedWith("Pausable: paused");
      });

      it("Should revert if the sender has no enough zeta", async () => {
        await (
          await zetaTokenEthContract.connect(randomSigner).approve(zetaConnectorEthContract.address, 100_000)
        ).wait();

        await expect(
          zetaConnectorNonEthContract.connect(randomSigner).send({
            destinationAddress: randomSigner.address,
            destinationChainId: 1,
            gasLimit: 2500000,
            message: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            zetaAmount: 1000,
            zetaParams: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
          })
        ).to.revertedWith("ERC20: insufficient allowance");
      });

      it("Should revert if the sender didn't allow ZetaConnector to spend Zeta token", async () => {
        await expect(
          zetaConnectorNonEthContract.send({
            destinationAddress: randomSigner.address,
            destinationChainId: 1,
            gasLimit: 2500000,
            message: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            zetaAmount: 1000,
            zetaParams: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
          })
        ).to.revertedWith("ERC20: insufficient allowance");
      });

      it("Should burn Zeta token from the sender account", async () => {
        const initialBalanceDeployer = await zetaTokenNonEthContract.balanceOf(tssUpdater.address);
        expect(initialBalanceDeployer.toString()).to.equal("100000000000000000000000");

        await tssUpdaterApproveConnectorNonEth();

        await (
          await zetaConnectorNonEthContract.send({
            destinationAddress: randomSigner.address,
            destinationChainId: 1,
            gasLimit: 2500000,
            message: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            zetaAmount: 1000,
            zetaParams: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
          })
        ).wait();

        const finalBalanceDeployer = await zetaTokenNonEthContract.balanceOf(tssUpdater.address);
        expect(finalBalanceDeployer.toString()).to.equal("99999999999999999999000");
      });

      it("Should emit `ZetaSent` on success", async () => {
        const zetaSentFilter = zetaConnectorNonEthContract.filters.ZetaSent();
        const e1 = await zetaConnectorNonEthContract.queryFilter(zetaSentFilter);
        expect(e1.length).to.equal(0);

        await zetaConnectorNonEthContract.send({
          destinationAddress: randomSigner.address,
          destinationChainId: 1,
          gasLimit: 2500000,
          message: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
          zetaAmount: 0,
          zetaParams: new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
        });

        const e2 = await zetaConnectorNonEthContract.queryFilter(zetaSentFilter);
        expect(e2.length).to.equal(1);
      });
    });

    describe("onReceive", () => {
      it("Should revert if the contract is paused", async () => {
        await (await zetaConnectorNonEthContract.pause()).wait();
        const paused1 = await zetaConnectorNonEthContract.paused();
        expect(paused1).to.equal(true);

        await expect(
          zetaConnectorNonEthContract.onReceive(
            tssUpdater.address,
            1,
            randomSigner.address,
            1000,
            new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          )
        ).to.revertedWith("Pausable: paused");
      });

      it("Should revert if not called by TSS address", async () => {
        await expect(
          zetaConnectorNonEthContract.onReceive(
            tssUpdater.address,
            1,
            randomSigner.address,
            1000,
            new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          )
        ).to.revertedWith("ZetaConnector: only TSS address can call this function");
      });

      it("Should revert if mint fails", async () => {
        await zetaTokenNonEthContract.updateTSSAndConnectorAddresses(tssSigner.address, randomSigner.address);

        await expect(
          zetaConnectorNonEthContract
            .connect(tssSigner)
            .onReceive(
              randomSigner.address,
              1,
              zetaReceiverMockContract.address,
              1000,
              new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
              "0x0000000000000000000000000000000000000000000000000000000000000000"
            )
        ).to.revertedWith("ZetaNonEth: only TSSAddress or connectorAddress can mint");
      });

      it("Should mint on the receiver address", async () => {
        const initialBalanceReceiver = await zetaTokenNonEthContract.balanceOf(zetaReceiverMockContract.address);
        expect(initialBalanceReceiver.toString()).to.equal("0");

        await (
          await zetaConnectorNonEthContract
            .connect(tssSigner)
            .onReceive(
              randomSigner.address,
              1,
              zetaReceiverMockContract.address,
              1000,
              new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
              "0x0000000000000000000000000000000000000000000000000000000000000000"
            )
        ).wait();

        const finalBalanceReceiver = await zetaTokenNonEthContract.balanceOf(zetaReceiverMockContract.address);

        expect(finalBalanceReceiver.toString()).to.equal("1000");
      });

      it("Should emit `ZetaReceived` on success", async () => {
        await transfer100kZetaNonEth(zetaConnectorNonEthContract.address);

        const zetaReceivedFilter = zetaConnectorNonEthContract.filters.ZetaReceived();
        const e1 = await zetaConnectorNonEthContract.queryFilter(zetaReceivedFilter);
        expect(e1.length).to.equal(0);

        await (
          await zetaConnectorNonEthContract
            .connect(tssSigner)
            .onReceive(
              randomSigner.address,
              1,
              zetaReceiverMockContract.address,
              1000,
              new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
              "0x0000000000000000000000000000000000000000000000000000000000000000"
            )
        ).wait();

        const e2 = await zetaConnectorNonEthContract.queryFilter(zetaReceivedFilter);
        expect(e2.length).to.equal(1);
      });
    });

    describe("onRevert", () => {
      it("Should revert if the contract is paused", async () => {
        await (await zetaConnectorNonEthContract.pause()).wait();
        const paused1 = await zetaConnectorNonEthContract.paused();
        expect(paused1).to.equal(true);

        await expect(
          zetaConnectorNonEthContract.onRevert(
            randomSigner.address,
            1,
            randomSigner.address,
            2,
            1000,
            new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          )
        ).to.revertedWith("Pausable: paused");
      });

      it("Should revert if not called by TSS address", async () => {
        await expect(
          zetaConnectorNonEthContract.onRevert(
            randomSigner.address,
            1,
            tssUpdater.address,
            1,
            1000,
            new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          )
        ).to.revertedWith("ZetaConnector: only TSS address can call this function");
      });

      it("Should mint on the origin address", async () => {
        const initialBalanceSender = await zetaTokenNonEthContract.balanceOf(zetaReceiverMockContract.address);
        expect(initialBalanceSender.toString()).to.equal("0");

        await (
          await zetaConnectorNonEthContract
            .connect(tssSigner)
            .onRevert(
              zetaReceiverMockContract.address,
              1,
              randomSigner.address,
              1,
              1000,
              new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
              "0x0000000000000000000000000000000000000000000000000000000000000000"
            )
        ).wait();

        const finalBalanceSender = await zetaTokenNonEthContract.balanceOf(zetaReceiverMockContract.address);
        expect(finalBalanceSender.toString()).to.equal("1000");
      });

      it("Should emit `ZetaReverted` on success", async () => {
        await transfer100kZetaNonEth(zetaConnectorNonEthContract.address);

        const zetaRevertedFilter = zetaConnectorNonEthContract.filters.ZetaReverted();
        const e1 = await zetaConnectorNonEthContract.queryFilter(zetaRevertedFilter);
        expect(e1.length).to.equal(0);

        await (
          await zetaConnectorNonEthContract
            .connect(tssSigner)
            .onRevert(
              zetaReceiverMockContract.address,
              1,
              randomSigner.address,
              1,
              1000,
              new ethers.utils.AbiCoder().encode(["string"], ["hello"]),
              "0x0000000000000000000000000000000000000000000000000000000000000000"
            )
        ).wait();

        const e2 = await zetaConnectorNonEthContract.queryFilter(zetaRevertedFilter);
        expect(e2.length).to.equal(1);
      });
    });
  });
});
