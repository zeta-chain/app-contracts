import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai from "chai";
import { ethers } from "hardhat";

import { getZetaConnectorMock } from "../lib/zeta-interactor/ZetaInteractor.helpers";
import { ZetaInteractorMock } from "../typechain-types";

chai.should();

describe("ZetaTokenConsumer tests", () => {
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
});
