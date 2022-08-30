// eslint-disable-next-line no-unused-vars
import { getAddress, isNetworkName } from "@zetachain/addresses";
import { saveAddress } from "@zetachain/addresses-tools";
import { parseUnits } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import { getContract } from "../../lib/shared/deploy.helpers";
import {
  CrossChainLending,
  CrossChainLending__factory,
  FakeERC20,
  FakeERC20__factory,
  OracleChainLink,
  OracleChainLink__factory
} from "../../typechain-types";

interface DataFeeds {
  BTC_USD_DATA_FEED: string;
  ETH_USD_DATA_FEED: string;
  USDC_USD_DATA_FEED: string;
}

const getDataFeedsByNetwork = (network: string): DataFeeds | undefined => {
  if (network === "goerli") {
    return {
      BTC_USD_DATA_FEED: "0xA39434A63A52E749F02807ae27335515BA4b07F7",
      ETH_USD_DATA_FEED: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
      USDC_USD_DATA_FEED: "0x533753B6DE9a603A1e0169A689Fb85499BEFb9AC"
    };
  } else if (network === "bsc-testnet") {
    return {
      BTC_USD_DATA_FEED: "0x5741306c21795FdCBb9b265Ea0255F499DFe515C",
      ETH_USD_DATA_FEED: "0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7",
      USDC_USD_DATA_FEED: "0x903dcaCCfF2B9453414C6F42621dD50A20d2faa9"
    };
  }
};

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

export const setInitialData = async () => {
  console.log(`Deploying CrossChainLending...`);
  const dataFeeds = getDataFeedsByNetwork(network.name);
  const fakeTokens = getFakeTokensByNetwork(network.name);

  if (!isNetworkName(network.name)) throw new Error("Invalid network name");
  if (!dataFeeds || !fakeTokens) throw new Error("Invalid network name");

  const crossChainLending = await getContract<CrossChainLending__factory, CrossChainLending>({
    contractName: "CrossChainLending",
    deployParams: undefined,
    existingContractAddress: getAddress("crossChainLending")
  });

  const oracleChainLink = await getContract<OracleChainLink__factory, OracleChainLink>({
    contractName: "OracleChainLink",
    deployParams: undefined,
    existingContractAddress: getAddress("crossChainLendingOracle")
  });

  const fakeWETH = await getContract<FakeERC20__factory, FakeERC20>({
    contractName: "FakeERC20",
    existingContractAddress: fakeTokens.WETH
  });

  const fakeWBTC = await getContract<FakeERC20__factory, FakeERC20>({
    contractName: "FakeERC20",
    existingContractAddress: fakeTokens.WBTC
  });

  const fakeUSDC = await getContract<FakeERC20__factory, FakeERC20>({
    contractName: "FakeERC20",
    existingContractAddress: fakeTokens.USDC
  });

  await oracleChainLink.setAggregator(fakeWETH.address, dataFeeds.ETH_USD_DATA_FEED, { gasLimit: 2000000 });
  await oracleChainLink.setAggregator(fakeWBTC.address, dataFeeds.BTC_USD_DATA_FEED, { gasLimit: 2000000 });
  await oracleChainLink.setAggregator(fakeUSDC.address, dataFeeds.USDC_USD_DATA_FEED, { gasLimit: 2000000 });

  await crossChainLending.setOracle(oracleChainLink.address, { gasLimit: 2000000 });
  await crossChainLending.setAllowedToken(fakeWETH.address, true, { gasLimit: 2000000 });
  await crossChainLending.setRiskTable(fakeWETH.address, 2, { gasLimit: 2000000 });
  await crossChainLending.setAllowedToken(fakeWBTC.address, true, { gasLimit: 2000000 });
  await crossChainLending.setRiskTable(fakeWBTC.address, 2, { gasLimit: 2000000 });
  await crossChainLending.setAllowedToken(fakeUSDC.address, true, { gasLimit: 2000000 });
  await crossChainLending.setRiskTable(fakeUSDC.address, 2, { gasLimit: 2000000 });

  // let's create the initial USDC pool
  await fakeWETH.approve(crossChainLending.address, parseUnits("500"), { gasLimit: 2000000 });
  await crossChainLending.deposit(fakeWETH.address, parseUnits("500"), { gasLimit: 2000000 });

  await fakeWBTC.approve(crossChainLending.address, parseUnits("500"), { gasLimit: 2000000 });
  await crossChainLending.deposit(fakeWBTC.address, parseUnits("500"), { gasLimit: 2000000 });

  await fakeUSDC.approve(crossChainLending.address, parseUnits("500"), { gasLimit: 2000000 });
  await crossChainLending.deposit(fakeUSDC.address, parseUnits("500"), { gasLimit: 2000000 });
};
