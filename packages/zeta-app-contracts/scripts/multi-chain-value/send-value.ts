import { getChainId, isNetworkName, isZetaTestnet } from "@zetachain/addresses";
import { parseEther } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import { getMultiChainValue } from "../../lib/multi-chain-value/MultiChainValue.helpers";
import { getAddress } from "../../lib/shared/address.helpers";
import { getErc20 } from "../../lib/shared/deploy.helpers";

const networkName = network.name;
const { ZETA_NETWORK } = process.env;

async function main() {
  if (!isNetworkName(networkName)) throw new Error("Invalid network name");
  const multiChainValueContract = await getMultiChainValue(getAddress("multiChainValue"));

  const zetaToken = await getErc20(getAddress("zetaToken"));

  const amount = parseEther("1");

  const tx = await zetaToken.approve(multiChainValueContract.address, amount.mul(10));
  await tx.wait();

  if (isZetaTestnet(ZETA_NETWORK)) {
    networkName !== "goerli" &&
      (await (
        await multiChainValueContract.send(
          getChainId("goerli"),
          ethers.utils.solidityPack(["address"], [process.env.PUBLIC_KEY_1]),
          amount
        )
      ).wait());

    networkName !== "klaytn-baobab" &&
      (await (
        await multiChainValueContract.send(
          getChainId("klaytn-baobab"),
          ethers.utils.solidityPack(["address"], [process.env.PUBLIC_KEY_1]),
          amount
        )
      ).wait());

    networkName !== "polygon-mumbai" &&
      (await (
        await multiChainValueContract.send(
          getChainId("polygon-mumbai"),
          ethers.utils.solidityPack(["address"], [process.env.PUBLIC_KEY_1]),
          amount
        )
      ).wait());

    networkName !== "bsc-testnet" &&
      (await (
        await multiChainValueContract.send(
          getChainId("bsc-testnet"),
          ethers.utils.solidityPack(["address"], [process.env.PUBLIC_KEY_1]),
          amount
        )
      ).wait());

    networkName !== "athens" &&
      (await (
        await multiChainValueContract.send(
          getChainId("athens"),
          ethers.utils.solidityPack(["address"], [process.env.PUBLIC_KEY_1]),
          amount
        )
      ).wait());
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
