import { MaxUint256 } from "@ethersproject/constants";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getChainId } from "@zetachain/addresses";
import { getAddress } from "@zetachain/addresses";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import {
  ERC20__factory,
  IUniswapV2Factory__factory,
  IUniswapV2Pair__factory,
  IUniswapV2Router02,
  SystemContract__factory,
  UniswapV2Router02,
  UniswapV2Router02__factory
} from "../../typechain-types";
import { SYSTEM_CONTRACT } from "../systemConstants";

async function main() {
  const [deployer] = await ethers.getSigners();

  const systemContract = await SystemContract__factory.connect(SYSTEM_CONTRACT, deployer);
  let tokenAddress;
  tokenAddress = await systemContract.wzetaContractAddress();
  console.log(`wzetaContractAddress:`, tokenAddress);

  tokenAddress = await systemContract.gasCoinZRC20(getChainId("goerli"));
  console.log(`gETH:`, tokenAddress);
  tokenAddress = await systemContract.gasCoinZRC20(getChainId("klaytn-baobab"));
  console.log(`tKLAY:`, tokenAddress);
  tokenAddress = await systemContract.gasCoinZRC20(getChainId("bsc-testnet"));
  console.log(`tBNB:`, tokenAddress);
  tokenAddress = await systemContract.gasCoinZRC20(getChainId("polygon-mumbai"));
  console.log(`tMATIC:`, tokenAddress);

  tokenAddress = await systemContract.uniswapv2FactoryAddress();
  console.log(`uniswapv2FactoryAddress:`, tokenAddress);
  tokenAddress = await systemContract.uniswapv2Router02Address();
  console.log(`uniswapv2Router02Address:`, tokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
