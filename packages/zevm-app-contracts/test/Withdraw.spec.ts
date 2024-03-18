import { parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getNonZetaAddress } from "@zetachain/protocol-contracts";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import { MockSystemContract, MockZRC20 } from "../typechain-types";
import { WithdrawalEvent } from "../typechain-types/contracts/shared/MockZRC20";
import { WithdrawERC20 } from "../typechain-types/contracts/withdrawErc20/withdrawErc20.sol";
import { WithdrawERC20__factory } from "../typechain-types/factories/contracts/withdrawErc20/withdrawErc20.sol";
import { evmSetup } from "./test.helpers";

const encodeToBytes = (destination: string) => {
  return ethers.utils.hexlify(ethers.utils.zeroPad(destination, 32));
};

describe("Withdraw tests", () => {
  let withdrawERC20Contract: WithdrawERC20;
  let ZRC20Contracts: MockZRC20[];
  let mockUSDCContracts: MockZRC20;
  let systemContract: MockSystemContract;

  let accounts: SignerWithAddress[];
  let deployer: SignerWithAddress;
  let fakeTSS: SignerWithAddress;

  beforeEach(async () => {
    [deployer, fakeTSS, ...accounts] = await ethers.getSigners();

    await network.provider.send("hardhat_setBalance", [deployer.address, parseUnits("1000000").toHexString()]);

    const uniswapRouterAddr = getNonZetaAddress("uniswapV2Router02", "eth_mainnet");

    const uniswapFactoryAddr = getNonZetaAddress("uniswapV2Factory", "eth_mainnet");

    const wGasToken = getNonZetaAddress("weth9", "eth_mainnet");

    const evmSetupResult = await evmSetup(wGasToken, uniswapFactoryAddr, uniswapRouterAddr);
    ZRC20Contracts = evmSetupResult.ZRC20Contracts;
    systemContract = evmSetupResult.systemContract;
    mockUSDCContracts = ZRC20Contracts[3];

    const WithdrawERC20Factory = (await ethers.getContractFactory("WithdrawERC20")) as WithdrawERC20__factory;
    withdrawERC20Contract = (await WithdrawERC20Factory.deploy(systemContract.address)) as WithdrawERC20;
    await withdrawERC20Contract.deployed();
  });

  describe("WithdrawERC20", () => {
    it("Should withdraw", async () => {
      const encodedDestination = encodeToBytes(fakeTSS.address);
      const INITIAL_AMOUNT = parseEther("10");
      const gasFee = await mockUSDCContracts.gasFee();
      const expectedAmount = INITIAL_AMOUNT.sub(gasFee);

      await mockUSDCContracts.approve(withdrawERC20Contract.address, INITIAL_AMOUNT);
      const tx = await withdrawERC20Contract.withdraw(mockUSDCContracts.address, INITIAL_AMOUNT, encodedDestination);
      const receipt = await tx.wait();

      expect(receipt.events).not.to.be.undefined;
      expect(receipt.events?.length).to.be.above(1);

      //@ts-ignore
      const withdrawalEvent: WithdrawalEvent = receipt.events[receipt.events?.length - 2] as WithdrawalEvent;
      const decodedEventData = mockUSDCContracts.interface.parseLog(withdrawalEvent);

      expect(decodedEventData.args.from).to.equal(withdrawERC20Contract.address);
      expect(decodedEventData.args.to).equal(encodedDestination.toLowerCase());

      //@dev: We are assuming that the value is within 10% of the expected amount because we lost something on swap
      expect(decodedEventData.args.value).to.be.lt(expectedAmount);
      expect(decodedEventData.args.value).to.be.gt(expectedAmount.mul(9).div(10));

      expect(decodedEventData.args.gasfee).to.equal(gasFee);
      expect(decodedEventData.args.protocolFlatFee).to.eq(0);

      const balance = await mockUSDCContracts.balanceOf(fakeTSS.address);
      expect(balance).to.equal(decodedEventData.args.value);
    });

    it("Should revert if it's not enough", async () => {
      const INITIAL_AMOUNT = parseEther("0.01");

      await mockUSDCContracts.approve(withdrawERC20Contract.address, INITIAL_AMOUNT);
      const tx = withdrawERC20Contract.withdraw(
        mockUSDCContracts.address,
        INITIAL_AMOUNT,
        encodeToBytes(fakeTSS.address)
      );
      await expect(tx).to.be.reverted;
    });
  });
});
