import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai, { expect } from "chai";
import { ethers } from "hardhat";

import { getZetaConnectorMock } from "../lib/zeta-interactor/ZetaInteractor.helpers";
import { ZetaInteractorMock } from "../typechain-types";
import { getCustomErrorMessage } from "./test.helpers";

chai.should();

describe("ZetaInteractor tests", () => {
  let zetaInteractorMock: ZetaInteractorMock;
  const chainAId = 1;
  const chainBId = 2;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let crossChainContractB: SignerWithAddress;
  let zetaConnector: SignerWithAddress;

  const encoder = new ethers.utils.AbiCoder();

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [deployer, crossChainContractB, zetaConnector] = accounts;

    zetaInteractorMock = await getZetaConnectorMock(zetaConnector.address);

    const encodedCrossChainAddressB = ethers.utils.solidityPack(["address"], [crossChainContractB.address]);
    await (await zetaInteractorMock.setInteractorByChainId(chainBId, encodedCrossChainAddressB)).wait();
  });

  describe("onZetaMessage", () => {
    it("Should revert if the caller is not ZetaConnector", async () => {
      await expect(
        zetaInteractorMock.onZetaMessage({
          zetaTxSenderAddress: ethers.utils.solidityPack(["address"], [zetaInteractorMock.address]),
          sourceChainId: chainBId,
          destinationAddress: crossChainContractB.address,
          zetaValueAndFees: 0,
          message: encoder.encode(["address"], [zetaInteractorMock.address]),
        })
      ).to.be.revertedWith(getCustomErrorMessage("InvalidCaller", [deployer.address]));
    });

    it("Should revert if the zetaTxSenderAddress it not in interactorsByChainId", async () => {
      await expect(
        zetaInteractorMock.connect(zetaConnector).onZetaMessage({
          zetaTxSenderAddress: ethers.utils.solidityPack(["address"], [zetaInteractorMock.address]),
          sourceChainId: chainBId,
          destinationAddress: crossChainContractB.address,
          zetaValueAndFees: 0,
          message: encoder.encode(["address"], [crossChainContractB.address]),
        })
      ).to.be.revertedWith(getCustomErrorMessage("InvalidZetaMessageCall"));
    });
  });

  describe("onZetaRevert", () => {
    it("Should revert if the caller is not ZetaConnector", async () => {
      await expect(
        zetaInteractorMock.onZetaRevert({
          zetaTxSenderAddress: deployer.address,
          sourceChainId: chainAId,
          destinationAddress: ethers.utils.solidityPack(["address"], [crossChainContractB.address]),
          destinationChainId: chainBId,
          zetaValueAndFees: 0,
          message: encoder.encode(["address"], [zetaInteractorMock.address]),
        })
      ).to.be.revertedWith(getCustomErrorMessage("InvalidCaller", [deployer.address]));
    });
  });
});
