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
import { ethers } from "hardhat";
import { network } from "hardhat";

import { ChainToZRC20, isSwappableNetwork, SwappableNetwork, ZRC20Addresses } from "../systemConstants";
import { getSwapData } from "./helpers";

const swapToChain = async (
  zetaSwapAddress: string,
  tssAddress: string,
  signer: SignerWithAddress,
  destinationNetwork: SwappableNetwork,
  value: BigNumber,
  nonce: number
) => {
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
    return [
      swapToChain(zetaSwapAddress, tssAddress, signer, destinationNetwork, parseEther("0.001"), baseNonce),
      swapToChain(zetaSwapAddress, tssAddress, signer, destinationNetwork, parseEther("0.002"), baseNonce + 1),
      swapToChain(zetaSwapAddress, tssAddress, signer, destinationNetwork, parseEther("0.003"), baseNonce + 2),
      swapToChain(zetaSwapAddress, tssAddress, signer, destinationNetwork, parseEther("0.004"), baseNonce + 3),
      swapToChain(zetaSwapAddress, tssAddress, signer, destinationNetwork, parseEther("0.005"), baseNonce + 4)
    ];
  });

  const swaps = swapsPerNetwork.reduce((p, c) => [...p, ...c], []);

  Promise.all(swaps);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
