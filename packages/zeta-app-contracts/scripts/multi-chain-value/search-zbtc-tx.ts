import { ethers, network } from "hardhat";

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

const preCalculatedResults = [
  "0xb59145790f705b023fedee9d803642b24221bacc8b285464b58d90d637872b30",
  "0xb78d08dc5e8051cec1427fe9343d65e3996fb21ba8f3483c4348dbe72f0e04ce",
  "0xc1dfa2f66e9c729d1e85fd2eaf8c5fbd2aee71f7b21d62a94e6d2b216b256fe2",
  "0xe07f7758634148491a340128ade1fd9e27c4a0ca02beb7a52c2cedb36dff5976",
  "0xdcd9ca7a9be91d10cb22df5e7b850844f26d144eb1884fd0ce1a3a3820358f17",
  "0xf5797d3188a54d586d11f4729a87eddfa46b9c8a2e17db79894a4ba428aa954e",
  "0xc7aa5681e715c403614635335a04026ad025080a828f60a031437cb22f42df11",
  "0xc47f55d77b27f3880bac796a09b53d0aeaae38cea8acd99d3d890d3518cfe580",
  "0x78f7b45ccdb7c3266a8a5d7575470001daea7396e58fe232e9c3a749446727f7",
  "0xb59145790f705b023fedee9d803642b24221bacc8b285464b58d90d637872b30",
  "0xb78d08dc5e8051cec1427fe9343d65e3996fb21ba8f3483c4348dbe72f0e04ce",
  "0xc1dfa2f66e9c729d1e85fd2eaf8c5fbd2aee71f7b21d62a94e6d2b216b256fe2",
  "0xe07f7758634148491a340128ade1fd9e27c4a0ca02beb7a52c2cedb36dff5976",
  "0xdcd9ca7a9be91d10cb22df5e7b850844f26d144eb1884fd0ce1a3a3820358f17",
  "0xf5797d3188a54d586d11f4729a87eddfa46b9c8a2e17db79894a4ba428aa954e",
  "0xc7aa5681e715c403614635335a04026ad025080a828f60a031437cb22f42df11",
  "0xc47f55d77b27f3880bac796a09b53d0aeaae38cea8acd99d3d890d3518cfe580",
  "0x78f7b45ccdb7c3266a8a5d7575470001daea7396e58fe232e9c3a749446727f7",
  "0xddb732c20c3ac963a1a16eb78d7af2b2c7a73468afd7baf92ef38097c0fc12de",
  "0x50e69755f7a815e1ddfc9ef091ea19a7b95099f3ad8befeddf8c2fcd01553c91",
  "0xfc57adb390a22a8e54c4ff6cf7280270002d6553185bd90d800b45cf72d7e203",
  "0x05a21a369f3045e53d31341e9bd8880254611a4eaa88b00090ec8c542b3fe882",
  "0x70c718c714d957ed34930420da379125eb6eaff70cf0103e14e7e3f2afb22542",
  "0x5e18c3f68f3b964af8b31d9276329e7e61ffb5d36881a9fc95cee56dea391984",
  "0x9bffb2df710d2036ad2dbcfdf5ac3f3783c92e10b55e74fc84bb1fcdc61e31b4",
  "0x52e44224ded45bc18ad03cfa6042f244a74b4d3e4778d0cf40a1201e03666c19",
  "0x83ae01f16be764e94360ae2f3b8ae219a4c388b0dc2d010993c9b57e53dc1674",
  "0xbec21c8e1a411c8397111d7ea666b58a5fcee9eab15e8cf26484c6b46754dad7",
  "0x9ac1ec1b723afa4f7a41c5a92199a21575be47c55f815fddf3b6ae8d3404c4bf",
  "0x86e41fcd6928e7435bcc925d16f523c7b5e2d611e29e563747eeeb4f19254bef",
  "0xa62c69ed5c4632160cfe3ab21fe4e6b1ce24e46642722ea9624c1c6a2123d479",
  "0x2e75fc8b803f406f75e01dd61272a1bd291e4943fe50bf65925053f95df7c5ba",
  "0x9aaefece38fd2bd87077038a63fffb7c84cc8dd1ed01de134a8504a1f9a410c3",
  "0xa1e0d5b75eb08b4f60ffaea7fbcf5090fb75e2e018887799989eea3b12c3e10a",
  "0x81126c18c7ca7d1fb7ded6644a87802e91bf52154ee4af7a5b379354e24fb6e0",
  "0x6c60cc1218dfa0af9c12bb529f8f21747df53faa1bb995cd60e86e76212a5600",
  "0x41ae1ecbf323fc39f149e7f9638800c9540b943d26f6d39002edd64452d85fa4",
  "0xcc03addcc86b53cad457b2cc459cde4c8cd68565e1f3abebfbf838bee7dc96ae",
  "0x36107b56c9dcf776712abbb0eef95d12e3099f821e163574440046e9b3baee0b",
  "0x2f705185db776988b6817fc6ac04d320e81fedb85a522941428321851bec6d9f",
  "0x386684d9a6156cc8f54cd34003e147a84bfeaa7c4558f1f10642e913378ce2c5",
  "0x4ccb24a326418411562ae0969100ff65a18e60a24558fe503f9defc3a250d411",
  "0xd27a67caefe97d4abfdf1c7d1a53cb411a58604c5eabda2e48a26d96cab099e8",
  "0xbf9a1b8bc7a1e918a2fc1795e0bb3df0ed4b7146161325580c47fa69c8e8369b",
  "0x1e155d7c9e30ab5c65a096cc92f4a40e9cb8d8c0b0416182a5e4784455b4e6cc",
  "0x0010d928235a05092dea55eeb4ed45944ff49cb7ec749b01793aadc2c8c74f54",
  "0xaf5a6622984421de67f18ab65c565e74d9047d8f38a7266dd8cd14370823f4df",
  "0xa059d7149e57c331d3fb13e36c1657160085dcbd5a8c6b01d0f48d271ab60614",
  "0x47c482df41abffb5b6827e13afc379b2f843bac2759c6d0eb1d00459f9cb31c5",
  "0x77b46aada73de00fa67aa4f72ac47257ddb96b4352851ca3664368bbf0d0ea23",
];

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
  // @dev: findTransactionsInRange takes 20 minutes to run then I pre run it and store the results in preCalculatedResults
  // const txHashes = await findTransactionsInRange();
  const txHashes = preCalculatedResults;

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
