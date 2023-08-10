import Quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

// export const QUOTER_CONTRACT_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";

// export const QUOTE_EXACT_INPUT_SINGLE =
//   "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) public override returns (uint256 amountOut)";

export const getAmountsOutUniswapV3 = async (
  // network: LabsQuoterSupportedChain,
  amountIn: BigNumber,
  tokenIn: string,
  tokenOut: string
): Promise<BigNumber[]> => {
  // Estos estan en labs
  // const chainId = parseInt(quoterChainIdByName[network], 10);
  // const provider = getProvider(network);
  const QUOTER_CONTRACT_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";

  const QUOTE_EXACT_INPUT_SINGLE =
    "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) public override returns (uint256 amountOut)";

  const provider = ethers.providers.getDefaultProvider("https://rpc.ankr.com/polygon_mumbai");

  const quoterContract = new ethers.Contract(QUOTER_CONTRACT_ADDRESS, [QUOTE_EXACT_INPUT_SINGLE], provider);

  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(tokenIn, tokenOut, 500, amountIn, 0);

  return quotedAmountOut;
};

async function main() {
  const ZETA = "0x0000c9ec4042283e8139c74f4c64bcd1e0b9b54f";
  const WETH = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889";

  const amountIn = BigNumber.from("10000000000000000");

  const ret1 = await getAmountsOutUniswapV3(amountIn, WETH, ZETA);
  console.log(ret1.toString());

  const ret2 = await getAmountsOutUniswapV3(amountIn, ZETA, WETH);
  console.log(ret2.toString());
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
