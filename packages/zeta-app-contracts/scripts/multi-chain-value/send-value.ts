import { getChainId, isNetworkName, isZetaTestnet, NetworkName } from "@zetachain/addresses";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import { getMultiChainValue } from "../../lib/multi-chain-value/MultiChainValue.helpers";
import { getAddress } from "../../lib/shared/address.helpers";
import { getErc20 } from "../../lib/shared/deploy.helpers";
import { MultiChainValue } from "../../typechain-types";

const networkName = network.name;
const { ZETA_NETWORK } = process.env;

const doTranfer = async (
  sourceChain: NetworkName,
  multiChainValueContract: MultiChainValue,
  chainId: number,
  amount: BigNumber,
  destinationAddress: string
) => {
  if (getChainId(sourceChain) == chainId) return;

  if (sourceChain === "athens") {
    const tx = await multiChainValueContract.sendZeta(chainId, destinationAddress, { value: amount });
    await tx.wait();
    return;
  }

  const tx = await multiChainValueContract.send(chainId, destinationAddress, amount);
  await tx.wait();
};

const main = async () => {
  if (!isNetworkName(networkName)) throw new Error("Invalid network name");
  const multiChainValueContract = await getMultiChainValue(getAddress("multiChainValue"));

  const [signer] = await ethers.getSigners();

  const amount = parseEther("1");

  if (networkName !== "athens") {
    const zetaToken = await getErc20(getAddress("zetaToken"));
    const tx = await zetaToken.approve(multiChainValueContract.address, amount.mul(10));
    await tx.wait();
  }

  if (isZetaTestnet(ZETA_NETWORK)) {
    const destinationAddress = ethers.utils.solidityPack(["address"], [process.env.PUBLIC_KEY_1 ?? signer.address]);

    await doTranfer(networkName, multiChainValueContract, getChainId("goerli"), amount, destinationAddress);
    // await doTranfer(networkName, multiChainValueContract, getChainId("klaytn-baobab"), amount, destinationAddress);
    await doTranfer(networkName, multiChainValueContract, getChainId("polygon-mumbai"), amount, destinationAddress);
    await doTranfer(networkName, multiChainValueContract, getChainId("bsc-testnet"), amount, destinationAddress);
    await doTranfer(networkName, multiChainValueContract, getChainId("athens"), amount, destinationAddress);
  }
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
