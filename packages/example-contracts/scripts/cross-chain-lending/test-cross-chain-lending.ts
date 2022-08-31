// eslint-disable-next-line no-unused-vars
import { getAddress, isNetworkName, NetworkName } from "@zetachain/addresses";
import { parseUnits } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import { networkVariables } from "../../lib/shared/network.constants";
import { CrossChainLending__factory, FakeERC20__factory } from "../../typechain-types";

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

export const action1 = async (networkName: NetworkName, networkName2: NetworkName) => {
  const fakeTokens = getFakeTokensByNetwork(networkName);
  const fakeTokensOther = getFakeTokensByNetwork(networkName2);

  if (!isNetworkName(network.name)) throw new Error("Invalid network name");
  if (!fakeTokens || !fakeTokensOther) throw new Error("Invalid network name");

  const provider = ethers.getDefaultProvider(networkName);

  const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);

  const crossChainLending = CrossChainLending__factory.connect(
    getAddress("crossChainLending", {
      customNetworkName: networkName
    }),
    signer
  );

  const fakeWBTC = FakeERC20__factory.connect(fakeTokens.WBTC, signer);

  let tx = await fakeWBTC.mint(parseUnits("1"), { gasLimit: 2000000 });
  await tx.wait();
  tx = await fakeWBTC.approve(crossChainLending.address, parseUnits("1"), { gasLimit: 2000000 });
  await tx.wait();
  tx = await crossChainLending.deposit(fakeWBTC.address, parseUnits("1"), { gasLimit: 2000000 });
  await tx.wait();
};

export const action2 = async (networkName: NetworkName, networkName2: NetworkName) => {
  const fakeTokens = getFakeTokensByNetwork(networkName);
  const fakeTokensOther = getFakeTokensByNetwork(networkName2);

  if (!isNetworkName(network.name)) throw new Error("Invalid network name");
  if (!fakeTokens || !fakeTokensOther) throw new Error("Invalid network name");

  const provider = ethers.getDefaultProvider(networkName);

  const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);

  const crossChainLending = CrossChainLending__factory.connect(
    getAddress("crossChainLending", {
      customNetworkName: networkName
    }),
    signer
  );

  const _networkVariables = networkVariables[network.name];
  await crossChainLending.borrow(
    fakeTokensOther.USDC,
    parseUnits("10000"),
    fakeTokensOther.WBTC,
    _networkVariables.crossChainId,
    parseUnits("1"),
    parseUnits("1"),
    {
      gasLimit: 2000000
    }
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
