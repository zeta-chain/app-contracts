/* ********************************* */
/* How to run this script 
/* To run this script you have to setup the enviroment (yarn and setup .env) and run this command 
/* ZETA_NETWORK=athens npx hardhat run scripts/zeta-swap/stress-swap.ts --network "polygon-mumbai" 
/* In the example we use "polygon-mumbai", that's the source network. Can be any valid source network 
/* Be sure to have enough gas tokens to pay all the tx 
/* This script is to stress the node but it's not optimize for real use. May fail to enquee some tx sometimes but will enquee enough to test 
/* ********************************* */

import { BigNumber } from "@ethersproject/bignumber";
import { formatEther, parseEther } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getAddress } from "@zetachain/addresses";
import { ethers, network } from "hardhat";

import { ChainToZRC20, isSwappableNetwork, SwappableNetwork, ZRC20Addresses } from "../systemConstants";
import { getSwapData } from "./helpers";

interface SwapToChainParams {
  destinationNetwork: SwappableNetwork;
  nonce: number;
  signer: SignerWithAddress;
  tssAddress: string;
  value: BigNumber;
  zetaSwapAddress: string;
}

const swapToChain = async ({
  zetaSwapAddress,
  tssAddress,
  signer,
  destinationNetwork,
  value,
  nonce
}: SwapToChainParams) => {
  const zrc20 = ChainToZRC20[destinationNetwork];
  const data = getSwapData(zetaSwapAddress, signer.address, ZRC20Addresses[zrc20], BigNumber.from("0"));
  const tx = await signer.sendTransaction({
    data,
    nonce,
    to: tssAddress,
    value
  });
  console.log(`tx: ${tx.hash}, nonce: ${nonce}, destinationToken: ${destinationNetwork}, value: ${formatEther(value)}`);
};

const main = async () => {
  if (!isSwappableNetwork(network.name) || !network.name) throw new Error("Invalid network name");
  const swappableNetwork: SwappableNetwork = network.name;

  // @dev: bitcoin is invalid as destination
  const invalidDestinations: SwappableNetwork[] = [swappableNetwork, "bitcoin-test"];
  const networks = Object.keys(ChainToZRC20).map(c => c as SwappableNetwork);

  const destinationNetworks = networks.filter(e => !invalidDestinations.includes(e));

  console.log(`Swapping native token...`);

  const [signer] = await ethers.getSigners();

  const zetaSwapAddress = getAddress({
    address: "zetaSwap",
    networkName: "athens",
    zetaNetwork: "athens"
  });

  const tssAddress = getAddress({
    address: "tss",
    networkName: network.name,
    zetaNetwork: "athens"
  });

  const nonce = await signer.getTransactionCount();

  const swapsPerNetwork = destinationNetworks.map((destinationNetwork, index) => {
    const baseNonce = nonce + index * 5;
    const param: SwapToChainParams = {
      destinationNetwork,
      nonce: baseNonce,
      signer,
      tssAddress,
      value: parseEther("0.002"),
      zetaSwapAddress
    };
    return [
      swapToChain(param),
      swapToChain({ ...param, nonce: baseNonce + 1, value: parseEther("0.002") }),
      swapToChain({ ...param, nonce: baseNonce + 2, value: parseEther("0.003") }),
      swapToChain({ ...param, nonce: baseNonce + 3, value: parseEther("0.004") }),
      swapToChain({ ...param, nonce: baseNonce + 4, value: parseEther("0.005") })
    ];
  });

  const swaps = swapsPerNetwork.reduce((p, c) => [...p, ...c], []);

  await Promise.all(swaps);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
