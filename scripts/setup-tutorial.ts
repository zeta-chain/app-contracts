import { Wallet } from "ethers";
import * as fs from "fs";
import * as https from "https";

const jsonPath = "scripts/.wallet.json";

interface WalletConfig {
  address: string;
  privateKey: string;
}

function saveEnvFiles(address: string, privateKey: string): void {
  const value: string = `
PRIVATE_KEY=${privateKey}
ZETA_NETWORK=athens
EXECUTE_PROGRAMMATICALLY=true`;
  const filePaths: string[] = ["packages/example-contracts/.env", "packages/zevm-example-contracts/.env"];

  filePaths.forEach((filePath: string) => {
    fs.writeFile(filePath, value, (err: NodeJS.ErrnoException | null) => {
      if (err) {
        console.error(`Failed to write to file ${filePath}: ${err}`);
      } else {
        console.log(`Updated .env file "${filePath}".`);
      }
    });
  });
}
function saveWalletFile(address: string, privateKey: string, jsonPath: string): void {
  const data = `{"address": "${address}", "privateKey": "${privateKey}"}`;


  fs.access(jsonPath, err => {
    if (err) {
      // The file does not exist, so we can write to it
      fs.writeFile(jsonPath, data, err => {
        if (err) throw err;
        console.log("The new wallet file has been saved!");
      });
    } else {
      // The file already exists, so we do not write to it
      // console.log("The file already exists!");
    }
  });
}
function callFaucet(address: string): void {
  // Hit Faucet to get some testnet Zeta
  console.log("Requesting testnet assets from the faucet...");
  const options: https.RequestOptions = {
    hostname: "faucet.zetachain.link",
    method: "GET",
    path: `/eth/${address}`,
    port: 443
  };

  const req = https.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on("data", d => {
      process.stdout.write(d);
    });
  });

  req.on("error", error => {
    console.error(error);
  });

  req.end();
}

function createWallet(filePath: string, callback: () => void): void {
  fs.access(filePath, err => {
    if (!err) {
      callback();
    }
  });
}

async function getOrCreateWallet(filePath: string): Promise<Wallet> {
  let wallet: Wallet;

  try {
    const data = await fs.promises.readFile(filePath, "utf8");
    const walletConfig: WalletConfig = JSON.parse(data);
    wallet = new Wallet(walletConfig.privateKey);
  } catch (error) {
    console.log("No Wallet Exists, Creating One...");
    const newWallet = Wallet.createRandom();
    const walletConfig: WalletConfig = {
      address: newWallet.address,
      privateKey: newWallet.privateKey
    };
    await fs.promises.writeFile(filePath, JSON.stringify(walletConfig));
    wallet = newWallet;
  }

  return wallet;
}

const wallet = getOrCreateWallet(jsonPath).then(async wallet => {
  console.log(`Your Wallet Address: ${wallet.address}`);
  console.log(`Your Private Key: ${wallet.privateKey.substring(2)}`);
  saveEnvFiles(wallet.address, wallet.privateKey.substring(2));
  saveWalletFile(wallet.address, wallet.privateKey.substring(2), jsonPath);
  await callFaucet(wallet.address);
});
