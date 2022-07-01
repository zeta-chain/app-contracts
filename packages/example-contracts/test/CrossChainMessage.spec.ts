import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getAddress } from "@zetachain/addresses";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import {
  deployCrossChainMessageMock,
  deployZetaConnectorMock,
  parseCrossChainMessageLog,
} from "../lib/cross-chain-message/CrossChainMessage.helpers";
import { deployZetaTokenConsumerUniV2, getZetaMock } from "../lib/shared/deploy.helpers";
import { CrossChainMessage, CrossChainMessageConnector, ZetaEthMock } from "../typechain-types";
import { ZetaTokenConsumerUniV2 } from "../typechain-types/@zetachain/protocol-contracts/contracts/ZetaTokenConsumerUniV2.strategy.sol";
import { addZetaEthLiquidityTest } from "./test.helpers";

describe("CrossChainMessage tests", () => {
  let zetaConnectorMockContract: CrossChainMessageConnector;
  let zetaEthTokenMockContract: ZetaEthMock;
  let zetaTokenConsumerUniV2: ZetaTokenConsumerUniV2;

  let crossChainMessageContractChainA: CrossChainMessage;
  const chainAId = 1;

  let crossChainMessageContractChainB: CrossChainMessage;
  const chainBId = 2;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let deployerAddress: string;

  const SAMPLE_TEXT = "Hello, Cross-Chain World!";
  const encoder = new ethers.utils.AbiCoder();

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [deployer] = accounts;
    deployerAddress = deployer.address;

    zetaEthTokenMockContract = await getZetaMock();
    zetaConnectorMockContract = await deployZetaConnectorMock();

    const uniswapRouterAddr = getAddress("uniswapV2Router02", {
      customNetworkName: "eth-mainnet",
      customZetaNetwork: "mainnet",
    });

    await addZetaEthLiquidityTest(zetaEthTokenMockContract.address, parseEther("200000"), parseEther("100"), deployer);
    //@dev: just to guarantee the running account has no zeta at all but still can use our protocol :D
    const zetaBalance = await zetaEthTokenMockContract.balanceOf(deployer.address);
    await zetaEthTokenMockContract.transfer(accounts[5].address, zetaBalance);

    zetaTokenConsumerUniV2 = await deployZetaTokenConsumerUniV2(zetaEthTokenMockContract.address, uniswapRouterAddr);

    crossChainMessageContractChainA = await deployCrossChainMessageMock({
      zetaConnectorMockAddress: zetaConnectorMockContract.address,
      zetaTokenConsumerAddress: zetaTokenConsumerUniV2.address,
    });

    crossChainMessageContractChainB = await deployCrossChainMessageMock({
      zetaConnectorMockAddress: zetaConnectorMockContract.address,
      zetaTokenConsumerAddress: zetaTokenConsumerUniV2.address,
    });

    await crossChainMessageContractChainB.setInteractorByChainId(
      chainAId,
      ethers.utils.solidityPack(["address"], [crossChainMessageContractChainA.address])
    );

    await crossChainMessageContractChainA.setInteractorByChainId(
      chainBId,
      ethers.utils.solidityPack(["address"], [crossChainMessageContractChainB.address])
    );
  });

  describe("sendHelloWorld", () => {
    it("Should revert if the cross chain address wasn't set", async () => {
      const unsetContract = await deployCrossChainMessageMock({
        zetaConnectorMockAddress: zetaConnectorMockContract.address,
        zetaTokenConsumerAddress: zetaTokenConsumerUniV2.address,
      });

      await expect(unsetContract.sendHelloWorld(chainAId)).to.be.revertedWith("InvalidDestinationChainId()");
    });

    it("Should send hello world", async () => {
      await expect(crossChainMessageContractChainA.sendHelloWorld(chainBId, { value: parseEther("1") })).to.be.not
        .reverted;
    });
  });

  describe("onZetaMessage", () => {
    it("Should revert if the caller is not the Connector contract", async () => {
      await expect(
        crossChainMessageContractChainA.onZetaMessage({
          destinationAddress: crossChainMessageContractChainB.address,
          message: encoder.encode(["address", "string"], [deployerAddress, SAMPLE_TEXT]),
          sourceChainId: 1,
          zetaTxSenderAddress: ethers.utils.solidityPack(["address"], [crossChainMessageContractChainA.address]),
          zetaValueAndGas: 0,
        })
      ).to.be.revertedWith(`InvalidCaller("${deployer.address}")`);
    });

    it("Should revert if the cross-chain address doesn't match with the stored one", async () => {
      await expect(
        zetaConnectorMockContract.callOnZetaMessage(
          ethers.utils.solidityPack(["address"], [deployerAddress]),
          1,
          crossChainMessageContractChainB.address,
          0,
          encoder.encode(["address", "string"], [zetaConnectorMockContract.address, SAMPLE_TEXT])
        )
      ).to.be.revertedWith("InvalidZetaMessageCall()");
    });

    describe("Given a valid message", () => {
      it("Should emit a message", async () => {
        const messageType = await crossChainMessageContractChainA.HELLO_WORLD_MESSAGE_TYPE();

        const tx = await zetaConnectorMockContract.callOnZetaMessage(
          ethers.utils.solidityPack(["address"], [crossChainMessageContractChainA.address]),
          1,
          crossChainMessageContractChainB.address,
          0,
          encoder.encode(["bytes32", "string"], [messageType, SAMPLE_TEXT])
        );

        const result = await tx.wait();
        const eventNames = parseCrossChainMessageLog(result.logs);
        expect(eventNames.filter((e) => e === "HelloWorldEvent")).to.have.lengthOf(1);
      });
    });
  });
});
