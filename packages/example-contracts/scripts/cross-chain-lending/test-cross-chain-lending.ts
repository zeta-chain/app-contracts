// eslint-disable-next-line no-unused-vars
import { getAddress, isNetworkName, NetworkName } from "@zetachain/addresses";
import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import { getContractForNetwork } from "../../lib/shared/deploy.helpers";
import { networkVariables } from "../../lib/shared/network.constants";
import { CrossChainLending, CrossChainLending__factory, FakeERC20, FakeERC20__factory } from "../../typechain-types";

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

export const action1 = async (networkName: NetworkName, destinationNetworkName: NetworkName) => {
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

  await fakeWBTC.mint(parseUnits("1"));

  await fakeWBTC.approve(crossChainLending.address, parseUnits("1"));

  await crossChainLending.deposit(fakeWBTC.address, parseUnits("1"));
};

export const action2 = async (networkName: NetworkName, destinationNetworkName: NetworkName) => {
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

  const zetaValueAndGas = parseUnits("5");
  const crossChaindestinationGasLimit = BigNumber.from(500000);

  await zetaToken.approve(crossChainLending.address, zetaValueAndGas);

  const _networkVariables = networkVariables[networkName];
  console.log(
    fakeTokens.USDC,
    parseUnits("10000").toString(),
    fakeTokensDestinationChain.WBTC,
    _networkVariables.crossChainId,
    zetaValueAndGas.toString(),
    crossChaindestinationGasLimit.toString()
  );
  await crossChainLending.borrow(
    fakeTokens.USDC,
    parseUnits("10000"),
    fakeTokensDestinationChain.WBTC,
    _networkVariables.crossChainId,
    zetaValueAndGas,
    crossChaindestinationGasLimit
  );
};

export const main = async () => {
  console.log(`Test CrossChainLending...`);

  if (!isNetworkName(network.name)) throw new Error("Invalid network name");

  await action1("goerli", "bsc-testnet");
  await action2("bsc-testnet", "goerli");
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
