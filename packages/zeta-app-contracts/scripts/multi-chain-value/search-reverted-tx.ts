import { ContractReceipt, ContractTransaction, Transaction } from "ethers";
import { ethers, network } from "hardhat";

// Specify the address you're interested in
const ADDRESS = "0x70e967acFcC17c3941E87562161406d41676FD83";
let API_KEY = "";
let API_ENDPOINT = "";
let START_BLOCK = 0;
let END_BLOCK = 0;

if (network.name === "bsc_mainnet") {
  API_KEY = process.env.BSCSCAN_API_KEY || "";
  API_ENDPOINT = "api.bscscan.com";
  START_BLOCK = 35741686;
  END_BLOCK = 35844713;
} else if (network.name === "eth_mainnet") {
  API_KEY = process.env.ETHERSCAN_API_KEY || "";
  API_ENDPOINT = "api.etherscan.io";
  START_BLOCK = 19080591;
  END_BLOCK = 19157698;
} else {
  throw new Error("Unsupported network");
}

// Function to check if a transaction involves the specified address
const isTransactionOfInterest = (tx: any, address: string) => {
  return tx.from.toLowerCase() === address.toLowerCase() || tx.to.toLowerCase() === address.toLowerCase();
};

// Main function to iterate over the block range and find transactions
const findTransactionsInRange = async () => {
  let totalTx = 0;
  let totalErrorTx = 0;
  for (let i = START_BLOCK; i < END_BLOCK; i++) {
    // console.log(`Fetching block ${i} to ${END_BLOCK}...`);
    const API_URL = `https://${API_ENDPOINT}/api?module=account&action=txlist&address=${ADDRESS}&startblock=${i}&endblock=${END_BLOCK}&sort=asc&apikey=${API_KEY}`;

    try {
      const call = await fetch(API_URL);
      const response = await call.json();
      const result = response.result;
      const firstBlock = result[0].blockNumber;
      const lastBlock = result[result.length - 1].blockNumber;
      console.log(`Fetched block ${firstBlock} to ${lastBlock}...`);

      const filteredTx = result.filter((tx: any) => isTransactionOfInterest(tx, ADDRESS));
      const nonSuccesssfulTx = filteredTx.filter((tx: any) => tx.isError === "1" || tx.txreceipt_status !== "1");

      totalTx += filteredTx.length;
      totalErrorTx += nonSuccesssfulTx.length;
      for (const tx of nonSuccesssfulTx) {
        console.log(tx.hash);
      }
      if (result.length > 9000) {
        i = parseInt(result[result.length - 1].blockNumber) - 1;
      }
      if (lastBlock >= END_BLOCK) {
        break;
      }
    } catch (e) {
      console.log(`Error fetching block ${i}`, e);
    }
  }
  console.log(`total tx: ${totalTx} / Errors: ${totalErrorTx}`);
};

// Call the main function
const main = async () => {
  await findTransactionsInRange();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
