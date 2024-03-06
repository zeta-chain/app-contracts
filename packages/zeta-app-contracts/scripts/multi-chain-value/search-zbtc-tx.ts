import { ethers, network } from "hardhat";

import { precalculatedResults } from "./search-zbtc-tx-cache";

interface TransactionAnalysisResult {
  amount: string;
  btcAddress: string;
  hash: string;
  isSegWit: boolean;
}

// Specify the address you're interested in
const ADDRESS = "0x13A0c5930C028511Dc02665E7285134B6d11A5f4"; // BTC.BTC
const API_ENDPOINT = "zetachain.blockscout.com";
const END_BLOCK = 1857360;

// Function to check if a transaction involves the specified address
const isTransactionOfInterest = (tx: any, address: string) => {
  try {
    const isBTCDestination = tx?.to?.toLowerCase() === address.toLowerCase();
    const isWithdraw = tx?.input?.toLowerCase().includes("0xc7012626");
    const isError = tx?.isError === "1";
    return isBTCDestination && isWithdraw && !isError;
  } catch (e) {
    console.log(e);
    console.log(tx);
  }
};

// Main function to iterate over the block range and find transactions
const findTransactionsInRange = async () => {
  let totalTx = 0;
  let totalErrorTx = 0;
  let txHashes: string[] = [];
  let i = 0;
  const MAX_PAGE = 1000;
  while (i < MAX_PAGE) {
    const API_URL = `https://${API_ENDPOINT}/api?module=account&action=txlist&address=${ADDRESS}&sort=asc&filter_by=to&page=${i}&offset=1000`;

    try {
      const call = await fetch(API_URL);
      const response = await call.json();

      const result = response.result;
      const initBlock = result[0].blockNumber;
      const endBlock = result[result.length - 1].blockNumber;

      const filteredTx = result.filter((tx: any) => isTransactionOfInterest(tx, ADDRESS));

      totalTx += filteredTx.length;
      if (filteredTx.length > 0) {
        txHashes = txHashes.concat(filteredTx.map((tx: any) => tx.hash));
      }

      if (i % 10 === 0) {
        console.log(`Fetching page ${i}`);
        console.log(`Fetched block ${initBlock} to ${endBlock}...`);
        console.log(`total tx: ${totalTx}`);
      }
      if (endBlock >= END_BLOCK) {
        break;
      }
      i++;
    } catch (e) {
      console.log(`Error fetching block ${i}`, e);
    }
  }
  console.log(`total tx: ${totalTx} / Errors: ${totalErrorTx}`);
  console.log(txHashes);
  return txHashes;
};

const hexToString = (hex: string): string => {
  const hexWithoutPrefix = hex.startsWith("0x") ? hex.substring(2) : hex;
  let str = "";
  for (let i = 0; i < hexWithoutPrefix.length; i += 2) {
    const byte = parseInt(hexWithoutPrefix.substr(i, 2), 16);
    if (byte) str += String.fromCharCode(byte);
  }
  return str;
};

const isSegWitAddress = (address: string): boolean => {
  if (address.startsWith("bc1")) {
    return true;
  }

  if (address.startsWith("3")) {
    return true;
  }

  return false;
};

const decodeInputData = (input: string) => {
  const iface = new ethers.utils.Interface(["function withdraw(bytes memory to, uint256 amount)"]);

  const decoded = iface.decodeFunctionData("withdraw", input);

  const to = decoded[0]; // bytes memory to
  const amount = decoded[1]; // uint256 amount

  const result: TransactionAnalysisResult = {
    amount: amount.toString(),
    btcAddress: hexToString(to),
    hash: "",
    isSegWit: false,
  };
  return result;
};

const analyzeTransaction = async (txHash: string) => {
  const API_URL = `https://${API_ENDPOINT}/api/v2/transactions/${txHash}`;

  try {
    const call = await fetch(API_URL);
    const response = await call.json();
    const rawInput = response.raw_input;
    const result = decodeInputData(rawInput);
    result.isSegWit = isSegWitAddress(result.btcAddress);
    result.hash = txHash;

    return result;
  } catch (e) {
    console.log(`Error fetching tx ${txHash}`, e);
  }
};

// Call the main function
const main = async () => {
  // @dev: findTransactionsInRange takes 20 minutes to run then I pre run it and store the results in precalculatedResults
  // const txHashes = await findTransactionsInRange();
  const txHashes = precalculatedResults;

  const results: TransactionAnalysisResult[] = [];
  for (const txHash of txHashes) {
    const result = await analyzeTransaction(txHash);
    result && results.push(result);
  }

  console.table(results.filter((result) => !result.isSegWit));
  console.table(results.filter((result) => result.isSegWit));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
