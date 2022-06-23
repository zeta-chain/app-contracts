import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import {
  deployCrossChainWarriorsMock,
  deployZetaConnectorMock,
} from "../lib/cross-chain-warriors/CrossChainWarriors.helpers";
import { getZetaMock } from "../lib/shared/deploy.helpers";
import { CrossChainWarriorsMock, CrossChainWarriorsZetaConnectorMock, ZetaEthMock } from "../typechain-types";
import { getMintTokenId } from "./test.helpers";

describe("CrossChainWarriors tests", () => {
  let zetaConnectorMockContract: CrossChainWarriorsZetaConnectorMock;
  let zetaEthTokenMockContract: ZetaEthMock;

  let crossChainWarriorsContractChainA: CrossChainWarriorsMock;
  const chainAId = 1;

  let crossChainWarriorsContractChainB: CrossChainWarriorsMock;
  const chainBId = 2;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let account1: SignerWithAddress;
  let deployerAddress: string;
  let account1Address: string;
  const encoder = new ethers.utils.AbiCoder();

  beforeEach(async () => {
    zetaConnectorMockContract = await deployZetaConnectorMock();
    zetaEthTokenMockContract = await getZetaMock();

    crossChainWarriorsContractChainA = await deployCrossChainWarriorsMock({
      customUseEven: false,
      zetaConnectorMockAddress: zetaConnectorMockContract.address,
      zetaTokenMockAddress: zetaEthTokenMockContract.address,
    });
    await crossChainWarriorsContractChainA.setCrossChainId(chainBId);

    crossChainWarriorsContractChainB = await deployCrossChainWarriorsMock({
      customUseEven: true,
      zetaConnectorMockAddress: zetaConnectorMockContract.address,
      zetaTokenMockAddress: zetaEthTokenMockContract.address,
    });
    await crossChainWarriorsContractChainB.setCrossChainId(chainAId);
    await crossChainWarriorsContractChainB.setCrossChainAddress(
      ethers.utils.solidityPack(["address"], [crossChainWarriorsContractChainA.address])
    );

    await crossChainWarriorsContractChainA.setCrossChainAddress(
      ethers.utils.solidityPack(["address"], [crossChainWarriorsContractChainB.address])
    );

    /**
     * @description to pay for cross-chain gas
     */
    await zetaEthTokenMockContract.approve(crossChainWarriorsContractChainA.address, ethers.constants.MaxUint256);
    await zetaEthTokenMockContract.approve(crossChainWarriorsContractChainB.address, ethers.constants.MaxUint256);

    accounts = await ethers.getSigners();
    [deployer, account1] = accounts;
    deployerAddress = deployer.address;
    account1Address = account1.address;
  });

  describe("constructor", () => {
    it("Should set the tokenIds counter to 1 when useEven is false", async () => {
      expect(await crossChainWarriorsContractChainA.tokenIds()).to.equal(1);
    });

    it("Should set the tokenIds counter to 2 when useEven is true", async () => {
      expect(await crossChainWarriorsContractChainB.tokenIds()).to.equal(2);
    });
  });

  describe("mint", () => {
    it("Should increment tokenIds by two", async () => {
      expect(await crossChainWarriorsContractChainA.tokenIds()).to.equal(1);

      await (await crossChainWarriorsContractChainA.mint(account1Address)).wait();

      expect(await crossChainWarriorsContractChainA.tokenIds()).to.equal(3);
    });

    it("Should create a new NFT owned by the input address", async () => {
      const result = await (await crossChainWarriorsContractChainA.mint(account1Address)).wait();

      const tokenId = getMintTokenId(result);

      expect(await crossChainWarriorsContractChainA.ownerOf(tokenId)).to.equal(account1Address);
    });
  });

  describe("mintId", () => {
    it("Should mint an NFT with the given input id owned by the input address", async () => {
      const id = 10;

      await (await crossChainWarriorsContractChainA.mintId(account1Address, id)).wait();

      expect(await crossChainWarriorsContractChainA.ownerOf(id)).to.equal(account1Address);
    });
  });

  describe("crossChainTransfer", () => {
    it("Should revert if the caller is not the NFT owner nor approved", async () => {
      const id = 10;

      await (await crossChainWarriorsContractChainA.mintId(account1Address, id)).wait();

      /**
       * The caller is the contract deployer and the NFT owner is account1
       */
      expect(crossChainWarriorsContractChainA.crossChainTransfer(account1Address, id)).to.be.revertedWith(
        "Transfer caller is not owner nor approved"
      );
    });

    it("Should burn the tokenId", async () => {
      const id = 10;

      await (await crossChainWarriorsContractChainA.mintId(deployerAddress, id)).wait();

      expect(await crossChainWarriorsContractChainA.ownerOf(id)).to.equal(deployerAddress);

      await (await crossChainWarriorsContractChainA.crossChainTransfer(account1Address, id)).wait();

      expect(crossChainWarriorsContractChainA.ownerOf(id)).to.be.revertedWith(
        "ERC721: owner query for nonexistent token"
      );
    });

    it("Should mint tokenId in the destination chain", async () => {
      const id = 10;

      await (await crossChainWarriorsContractChainA.mintId(deployerAddress, id)).wait();

      await (await crossChainWarriorsContractChainA.crossChainTransfer(account1Address, id)).wait();

      expect(await crossChainWarriorsContractChainB.ownerOf(id)).to.equal(account1Address);
    });
  });

  describe("onZetaMessage", () => {
    it("Should revert if the caller is not the Connector contract", async () => {
      await expect(
        crossChainWarriorsContractChainA.onZetaMessage({
          zetaTxSenderAddress: ethers.utils.solidityPack(["address"], [crossChainWarriorsContractChainA.address]),
          originChainId: 1,
          destinationAddress: crossChainWarriorsContractChainB.address,
          zetaAmount: 0,
          message: encoder.encode(["address"], [deployerAddress]),
        })
      ).to.be.revertedWith("This function can only be called by the Connector contract");
    });

    it("Should revert if the cross-chain address doesn't match with the stored one", async () => {
      await expect(
        zetaConnectorMockContract.callOnZetaMessage(
          ethers.utils.solidityPack(["address"], [deployerAddress]),
          1,
          crossChainWarriorsContractChainB.address,
          0,
          encoder.encode(["address"], [zetaConnectorMockContract.address])
        )
      ).to.be.revertedWith("Cross-chain address doesn't match");
    });

    it("Should revert if the message type doesn't match with CROSS_CHAIN_TRANSFER_MESSAGE", async () => {
      const messageType = await crossChainWarriorsContractChainA.CROSS_CHAIN_TRANSFER_MESSAGE();

      const invalidMessageType = messageType.replace("9", "8");

      await expect(
        zetaConnectorMockContract.callOnZetaMessage(
          ethers.utils.solidityPack(["address"], [crossChainWarriorsContractChainA.address]),
          1,
          crossChainWarriorsContractChainB.address,
          0,
          encoder.encode(
            ["bytes32", "uint256 ", "address", "address"],
            [invalidMessageType, 1, deployerAddress, deployerAddress]
          )
        )
      ).to.be.revertedWith("Invalid message type");
    });

    it("Should revert if the token already exists", async () => {
      const messageType = await crossChainWarriorsContractChainA.CROSS_CHAIN_TRANSFER_MESSAGE();

      await crossChainWarriorsContractChainB.mintId(deployerAddress, 1);

      await expect(
        zetaConnectorMockContract.callOnZetaMessage(
          ethers.utils.solidityPack(["address"], [crossChainWarriorsContractChainA.address]),
          1,
          crossChainWarriorsContractChainB.address,
          0,
          encoder.encode(
            ["bytes32", "uint256 ", "address", "address"],
            [messageType, 1, deployerAddress, deployerAddress]
          )
        )
      ).to.be.revertedWith("ERC721: token already minted");
    });

    describe("Given a valid input", () => {
      it("Should mint a new token in the destination chain", async () => {
        const messageType = await crossChainWarriorsContractChainA.CROSS_CHAIN_TRANSFER_MESSAGE();

        await zetaConnectorMockContract.callOnZetaMessage(
          ethers.utils.solidityPack(["address"], [crossChainWarriorsContractChainA.address]),
          1,
          crossChainWarriorsContractChainB.address,
          0,
          encoder.encode(
            ["bytes32", "uint256 ", "address", "address"],
            [messageType, 1, deployerAddress, deployerAddress]
          )
        );

        expect(await crossChainWarriorsContractChainB.ownerOf(1)).to.equal(deployerAddress);
      });

      it("Should mint a new token in the destination chain, owned by the provided 'to' address", async () => {
        const messageType = await crossChainWarriorsContractChainA.CROSS_CHAIN_TRANSFER_MESSAGE();

        await zetaConnectorMockContract.callOnZetaMessage(
          ethers.utils.solidityPack(["address"], [crossChainWarriorsContractChainA.address]),
          1,
          crossChainWarriorsContractChainB.address,
          0,
          encoder.encode(
            ["bytes32", "uint256 ", "address", "address"],
            [messageType, 1, deployerAddress, account1Address]
          )
        );

        expect(await crossChainWarriorsContractChainB.ownerOf(1)).to.equal(account1Address);
      });
    });
  });

  describe("onZetaRevert", () => {
    /**
     * @description note that given how this test was implemented, the NFT will exist in the two chains
     * that's not the real-world behavior but it's ok for this unit test
     */
    it("Should give the NFT back to the sender", async () => {
      const nftId = 1;

      await (await crossChainWarriorsContractChainA.mintId(deployerAddress, nftId)).wait();

      await (await crossChainWarriorsContractChainA.crossChainTransfer(deployerAddress, nftId)).wait();

      // Make sure that the NFT was removed from the origin chain
      await expect(crossChainWarriorsContractChainA.ownerOf(nftId)).to.be.revertedWith(
        "ERC721: owner query for nonexistent token"
      );

      const messageType = await crossChainWarriorsContractChainA.CROSS_CHAIN_TRANSFER_MESSAGE();

      await zetaConnectorMockContract.callOnZetaRevert(
        crossChainWarriorsContractChainA.address,
        1337,
        chainBId,
        ethers.utils.solidityPack(["address"], [crossChainWarriorsContractChainB.address]),
        0,
        2500000,
        encoder.encode(
          ["bytes32", "uint256 ", "address", "address"],
          [messageType, nftId, deployerAddress, account1Address]
        )
      );

      expect(await crossChainWarriorsContractChainB.ownerOf(nftId)).to.equal(deployerAddress);
    });
  });
});
