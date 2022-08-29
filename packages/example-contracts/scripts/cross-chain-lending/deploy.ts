// eslint-disable-next-line no-unused-vars
import { getAddress } from "@ethersproject/address";
import { isNetworkName } from "@zetachain/addresses";
import { parseUnits } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import {
  CrossChainLending__factory,
  FakeERC20__factory,
  OracleChainLink__factory,
  StableCoinAggregator__factory
} from "../../typechain-types";

async function main() {
  console.log(`Deploying CrossChainLending...`);
  if (!isNetworkName(network.name)) throw new Error("Invalid network name");

  const accounts = await ethers.getSigners();
  const [deployer] = accounts;

  const connector = "0x000054d3A0Bc83Ec7808F52fCdC28A96c89F6C5c";
  const zetaToken = "0x000080383847bd75f91c168269aa74004877592f";

  let ETH_USD_DATA_FEED = "";
  let BTC_USD_DATA_FEED = "";
  let USDC_USD_DATA_FEED = "";

  if (network.name === "goerli") {
    ETH_USD_DATA_FEED = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e";
    BTC_USD_DATA_FEED = "0xA39434A63A52E749F02807ae27335515BA4b07F7";
    USDC_USD_DATA_FEED = "0x533753B6DE9a603A1e0169A689Fb85499BEFb9AC";
    // 0x533753B6DE9a603A1e0169A689Fb85499BEFb9AC
  } else if (network.name === "bsc-testnet") {
    ETH_USD_DATA_FEED = "0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7";
    BTC_USD_DATA_FEED = "0x5741306c21795FdCBb9b265Ea0255F499DFe515C";
    USDC_USD_DATA_FEED = "0x903dcaCCfF2B9453414C6F42621dD50A20d2faa9";
  }

  // const crossChainLendingFactory = new CrossChainLending__factory(deployer);
  // const crossChainLending = await crossChainLendingFactory.deploy(connector, zetaToken);
  // const oracleChainLinkFactory = new OracleChainLink__factory(deployer);
  // const oracleChainLink = await oracleChainLinkFactory.deploy();

  // console.log(`CrossChainLending deployed: ${crossChainLending.address} [${connector}, ${zetaToken}]`);
  // console.log(`oracleChainLink deployed: ${oracleChainLink.address}`);

  // return;

  // GOERLI
  const fakeWETH = await FakeERC20__factory.connect("0x7887cdA6209c9e7AD8b5fddAe9D72640b85712ce", deployer);
  const fakeWBTC = await FakeERC20__factory.connect("0x63C7535d1D539DCf70FED8e1FcB9815395494c13", deployer);
  const fakeUSDC = await FakeERC20__factory.connect("0xfC2E8952A891ef28e7Cb4a837828b475e6e9D67D", deployer);
  const crossChainLending = await CrossChainLending__factory.connect(
    "0x7BA000f2F17511085A188f90e7FdB63c29d9A245",
    deployer
  );
  const oracleChainLink = await OracleChainLink__factory.connect(
    "0x14227d82C6f7a2042B10aFaE261A02b016F36a7F",
    deployer
  );

  // BSC
  // const fakeWETH = await FakeERC20__factory.connect("0xfeFf56095A27766533BAECF591192fa48bE7F80F", deployer);
  // const fakeWBTC = await FakeERC20__factory.connect("0x4023A58E4d76714ca87B631120Ad146A99dcdee4", deployer);
  // const fakeUSDC = await FakeERC20__factory.connect("0xDF2D9975A4f61441Ef86813e689536058184a871", deployer);
  // const crossChainLending = await CrossChainLending__factory.connect(
  //   "0x884d83177Ac3662e16E99C1c134B917901d450DB",
  //   deployer
  // );
  // const oracleChainLink = await OracleChainLink__factory.connect(
  //   "0xF8D8276de96C4B329735A2B25Bd2F5E9D69AaECd",
  //   deployer
  // );

  // const encodedCrossChainAddress = ethers.utils.solidityPack(
  //   ["address"],
  //   ["0x884d83177Ac3662e16E99C1c134B917901d450DB"]
  // );
  // await crossChainLending.setInteractorByChainId(97, encodedCrossChainAddress, { gasLimit: 2000000 });
  // return;

  await oracleChainLink.setAggregator(fakeWETH.address, ETH_USD_DATA_FEED, { gasLimit: 2000000 });
  await oracleChainLink.setAggregator(fakeWBTC.address, BTC_USD_DATA_FEED, { gasLimit: 2000000 });
  await oracleChainLink.setAggregator(fakeUSDC.address, USDC_USD_DATA_FEED, { gasLimit: 2000000 });

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
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
