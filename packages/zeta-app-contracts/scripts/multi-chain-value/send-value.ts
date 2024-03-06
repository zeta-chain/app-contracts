import { getAddress, isProtocolNetworkName, ZetaProtocolNetwork } from "@zetachain/protocol-contracts";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers, network } from "hardhat";

import { getMultiChainValue } from "../../lib/multi-chain-value/MultiChainValue.helpers";
import { getErc20 } from "../../lib/shared/deploy.helpers";
import { MultiChainValue } from "../../typechain-types";
import { getAppAddress, getChainId } from "../address.helpers";

const networkName = network.name;

const doTranfer = async (
  sourceChain: ZetaProtocolNetwork,
  multiChainValueContract: MultiChainValue,
  chainId: number,
  amount: BigNumber,
  destinationAddress: string
) => {
  //@ts-ignore
  if (getChainId(sourceChain) == chainId) return;
  const ccmGasLimit = 100000;

  if (sourceChain === "zeta_testnet") {
    const tx = await multiChainValueContract.sendZeta(chainId, destinationAddress, ccmGasLimit, { value: amount });
    await tx.wait();
    return;
  }

  const tx = await multiChainValueContract.send(chainId, destinationAddress, amount, ccmGasLimit);
  await tx.wait();
};

const main = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  //@ts-ignore
  const isTestnet = isTestnetNetwork(networkName);
  if (!isTestnet)
    throw new Error("This script is only for testnet. If you are sure you want to run it, remove this line.");

  const multiChainValueContract = await getMultiChainValue(getAppAddress("multiChainValue", networkName));

  const [signer] = await ethers.getSigners();

  const amount = parseEther("1");

  if (networkName !== "zeta_testnet" && networkName !== "zeta_mainnet") {
    const zetaToken = await getErc20(getAddress("zetaToken", networkName));
    const tx = await zetaToken.approve(multiChainValueContract.address, amount.mul(10));
    await tx.wait();
  }

  const destinationAddress = ethers.utils.solidityPack(["address"], [process.env.PUBLIC_KEY_1 ?? signer.address]);

  //@ts-ignore
  const isTestnet = isTestnetNetwork(networkName);

  if (isTestnet) {
    await doTranfer(networkName, multiChainValueContract, getChainId("goerli_testnet"), amount, destinationAddress);
    await doTranfer(networkName, multiChainValueContract, getChainId("mumbai_testnet"), amount, destinationAddress);
    await doTranfer(networkName, multiChainValueContract, getChainId("bsc_testnet"), amount, destinationAddress);
    await doTranfer(networkName, multiChainValueContract, getChainId("zeta_testnet"), amount, destinationAddress);
  } else {
    await doTranfer(networkName, multiChainValueContract, getChainId("bsc_mainnet"), amount, destinationAddress);
    await doTranfer(networkName, multiChainValueContract, getChainId("zeta_mainnet"), amount, destinationAddress);
    await doTranfer(networkName, multiChainValueContract, getChainId("eth_mainnet"), amount, destinationAddress);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
