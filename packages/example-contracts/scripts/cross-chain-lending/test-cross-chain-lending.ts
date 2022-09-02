// eslint-disable-next-line no-unused-vars
import { isNetworkName, NetworkName } from "@zetachain/addresses";
import { BigNumber } from "ethers";
import { parseUnits, toUtf8String } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import { getContractForNetwork } from "../../lib/shared/deploy.helpers";
import { networkVariables } from "../../lib/shared/network.constants";
import { CrossChainLending, CrossChainLending__factory, FakeERC20, FakeERC20__factory } from "../../typechain-types";

interface BorrowParams {
  amount: BigNumber;
  collateralAsset: string;
  collateralChainId: number;
  crossChaindestinationGasLimit: BigNumber;
  debtAsset: string;
  zetaValueAndGas: BigNumber;
}

interface FakeTokens {
  USDC: string;
  WBTC: string;
  WETH: string;
}

const getFakeTokensByNetwork = (network: string): FakeTokens | undefined => {
  if (network === "goerli") {
    return {
      USDC: "0xfC2E8952A891ef28e7Cb4a837828b475e6e9D67D",
      WBTC: "0x63C7535d1D539DCf70FED8e1FcB9815395494c13",
      WETH: "0x7887cdA6209c9e7AD8b5fddAe9D72640b85712ce"
    };
  } else if (network === "bsc-testnet") {
    return {
      USDC: "0xDF2D9975A4f61441Ef86813e689536058184a871",
      WBTC: "0x4023A58E4d76714ca87B631120Ad146A99dcdee4",
      WETH: "0xfeFf56095A27766533BAECF591192fa48bE7F80F"
    };
  }
};

export const addCollateral = async (networkName: NetworkName) => {
  const fakeTokens = getFakeTokensByNetwork(networkName);

  if (!isNetworkName(network.name)) throw new Error("Invalid network name");
  if (!fakeTokens) throw new Error("Invalid network name");

  const crossChainLending = await getContractForNetwork<CrossChainLending__factory, CrossChainLending>({
    contractName: "CrossChainLending",
    networkName,
    zetaAddress: "crossChainLending"
  });

  const fakeWBTC = await getContractForNetwork<FakeERC20__factory, FakeERC20>({
    contractName: "FakeERC20",
    existingContractAddress: fakeTokens.WBTC,
    networkName
  });

  await fakeWBTC.mint(parseUnits("1000"));

  await fakeWBTC.approve(crossChainLending.address, parseUnits("1000"));

  await crossChainLending.deposit(fakeWBTC.address, parseUnits("1000"));
};

export const borrowUSDC = async (networkName: NetworkName, destinationNetworkName: NetworkName) => {
  const fakeTokens = getFakeTokensByNetwork(networkName);
  const fakeTokensDestinationChain = getFakeTokensByNetwork(destinationNetworkName);

  if (!isNetworkName(networkName)) throw new Error("Invalid network name");
  if (!fakeTokens || !fakeTokensDestinationChain) throw new Error("Invalid network name");

  const crossChainLending = await getContractForNetwork<CrossChainLending__factory, CrossChainLending>({
    contractName: "CrossChainLending",
    networkName,
    zetaAddress: "crossChainLending"
  });

  const zetaToken = await getContractForNetwork<FakeERC20__factory, FakeERC20>({
    contractName: "FakeERC20",
    networkName,
    zetaAddress: "zetaToken"
  });

  const zetaValueAndGas = parseUnits("50");
  const crossChaindestinationGasLimit = BigNumber.from(500000);

  await zetaToken.approve(crossChainLending.address, zetaValueAndGas);

  const _networkVariables = networkVariables[networkName];

  const params: BorrowParams = {
    amount: parseUnits("5000"),
    collateralAsset: fakeTokensDestinationChain.WBTC,
    collateralChainId: _networkVariables.crossChainId,
    crossChaindestinationGasLimit: crossChaindestinationGasLimit,
    debtAsset: fakeTokens.USDC,
    zetaValueAndGas: crossChaindestinationGasLimit
  };

  console.log(
    params.debtAsset,
    params.amount.toString(),
    params.collateralAsset,
    params.collateralChainId,
    params.zetaValueAndGas.toString(),
    params.crossChaindestinationGasLimit.toString()
  );
  await crossChainLending.borrow(
    params.debtAsset,
    params.amount.toString(),
    params.collateralAsset,
    params.collateralChainId,
    params.zetaValueAndGas.toString(),
    params.crossChaindestinationGasLimit.toString()
  );
};

export const main = async () => {
  console.log(`Test CrossChainLending...`);

  if (!isNetworkName(network.name)) throw new Error("Invalid network name");

  await addCollateral("goerli");
  await borrowUSDC("bsc-testnet", "goerli");
  // await addCollateral("bsc-testnet");
  // await borrowUSDC("goerli", "bsc-testnet");
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
