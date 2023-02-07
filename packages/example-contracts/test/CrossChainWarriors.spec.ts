import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

import {
  deployCrossChainWarriorsMock,
  deployZetaConnectorMock
} from "../lib/cross-chain-warriors/CrossChainWarriors.helpers";
import { getAddress } from "../lib/shared/address.helpers";
import { deployZetaTokenConsumerUniV2, getZetaMock } from "../lib/shared/deploy.helpers";
import { CrossChainWarriorsMock, CrossChainWarriorsZetaConnectorMock, ZetaEthMock } from "../typechain-types";
import { ZetaTokenConsumerUniV2 } from "../typechain-types/@zetachain/protocol-contracts/contracts/ZetaTokenConsumerUniV2.strategy.sol";
import { addZetaEthLiquidityTest, getMintTokenId } from "./test.helpers";

describe("CrossChainWarriors tests", () => {
  let zetaConnectorMockContract: CrossChainWarriorsZetaConnectorMock;
  let zetaEthTokenMockContract: ZetaEthMock;
  let zetaTokenConsumerUniV2: ZetaTokenConsumerUniV2;

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
    accounts = await ethers.getSigners();
    [deployer, account1] = accounts;
    deployerAddress = deployer.address;
    account1Address = account1.address;

    zetaEthTokenMockContract = await getZetaMock();
    zetaConnectorMockContract = await deployZetaConnectorMock();

    const uniswapRouterAddr = getAddress("uniswapV2Router02", {
      customNetworkName: "eth-mainnet",
      customZetaNetwork: "mainnet"
    });

    await addZetaEthLiquidityTest(zetaEthTokenMockContract.address, parseEther("200000"), parseEther("100"), deployer);
    // @dev: guarantee that the account has no zeta balance but still can use the protocol :D
    const zetaBalance = await zetaEthTokenMockContract.balanceOf(deployer.address);
    await zetaEthTokenMockContract.transfer(accounts[5].address, zetaBalance);

    zetaTokenConsumerUniV2 = await deployZetaTokenConsumerUniV2(zetaEthTokenMockContract.address, uniswapRouterAddr);

    crossChainWarriorsContractChainA = await deployCrossChainWarriorsMock({
      customUseEven: false,
      zetaConnectorMockAddress: zetaConnectorMockContract.address,
      zetaTokenConsumerAddress: zetaTokenConsumerUniV2.address,
      zetaTokenMockAddress: zetaEthTokenMockContract.address
    });

    crossChainWarriorsContractChainB = await deployCrossChainWarriorsMock({
      customUseEven: true,
      zetaConnectorMockAddress: zetaConnectorMockContract.address,
      zetaTokenConsumerAddress: zetaTokenConsumerUniV2.address,
      zetaTokenMockAddress: zetaEthTokenMockContract.address
    });

    await crossChainWarriorsContractChainB.setInteractorByChainId(
      chainAId,
      ethers.utils.solidityPack(["address"], [crossChainWarriorsContractChainA.address])
    );

    await crossChainWarriorsContractChainA.setInteractorByChainId(
      chainBId,
      ethers.utils.solidityPack(["address"], [crossChainWarriorsContractChainB.address])
    );
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
      expect(
        crossChainWarriorsContractChainA.crossChainTransfer(chainBId, account1Address, id, { value: parseEther("1") })
      ).to.be.revertedWith("Transfer caller is not owner nor approved");
    });

    it("Should burn the tokenId", async () => {
      const id = 10;

      await (await crossChainWarriorsContractChainA.mintId(deployerAddress, id)).wait();

      expect(await crossChainWarriorsContractChainA.ownerOf(id)).to.equal(deployerAddress);

      await (
        await crossChainWarriorsContractChainA.crossChainTransfer(chainBId, account1Address, id, {
          value: parseEther("1")
        })
      ).wait();

      expect(crossChainWarriorsContractChainA.ownerOf(id)).to.be.revertedWith(
        "ERC721: owner query for nonexistent token"
      );
    });

    it("Should mint tokenId in the destination chain", async () => {
      const id = 10;

      await (await crossChainWarriorsContractChainA.mintId(deployerAddress, id)).wait();

      await (
        await crossChainWarriorsContractChainA.crossChainTransfer(chainBId, account1Address, id, {
          value: parseEther("1")
        })
      ).wait();

      expect(await crossChainWarriorsContractChainB.ownerOf(id)).to.equal(account1Address);
    });
  });

  describe("onZetaMessage", () => {
    it("Should revert if the caller is not the Connector contract", async () => {
      await expect(
        crossChainWarriorsContractChainA.onZetaMessage({
          destinationAddress: crossChainWarriorsContractChainB.address,
          message: encoder.encode(["address"], [deployerAddress]),
          sourceChainId: 1,
          zetaTxSenderAddress: ethers.utils.solidityPack(["address"], [crossChainWarriorsContractChainA.address]),
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
          crossChainWarriorsContractChainB.address,
          0,
          encoder.encode(["address"], [zetaConnectorMockContract.address])
        )
      ).to.be.revertedWith("InvalidZetaMessageCall");
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
      ).to.be.revertedWith("InvalidMessageType");
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
    it("Should give the NFT back to the sourceTxOriginAddress", async () => {
      const nftId = 1;

      await (await crossChainWarriorsContractChainA.mintId(deployerAddress, nftId)).wait();

      await (
        await crossChainWarriorsContractChainA.crossChainTransfer(chainBId, deployerAddress, nftId, {
          value: parseEther("1")
        })
      ).wait();

      // Make sure that the NFT was removed from the source chain
      await expect(crossChainWarriorsContractChainA.ownerOf(nftId)).to.be.revertedWith("ERC721: invalid token ID");

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
