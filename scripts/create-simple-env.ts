import { ethers } from "ethers";
import * as fs from "fs";
import * as https from "https";

const newWallet = ethers.Wallet.createRandom();

console.log(`Your New Address:${newWallet.address}`);
console.log(`Your Private Key: ${newWallet.privateKey.substring(2)}`);

const value: string = `
PRIVATE_KEY=${newWallet.privateKey.substring(2)}
ZETA_NETWORK=athens
EXECUTE_PROGRAMMATICALLY=true`;
const filePaths: string[] = ["packages/example-contracts/.env", "packages/zevm-example-contracts/.env"];

filePaths.forEach((filePath: string) => {
  fs.writeFile(filePath, value, (err: NodeJS.ErrnoException | null) => {
    if (err) {
      console.error(`Failed to write to file ${filePath}: ${err}`);
    } else {
      console.log(`Added new .env file "${filePath}".`);
    }
  });
});

// Hit Faucet to get some testnet Zeta
const options: https.RequestOptions = {
  hostname: "faucet.zetachain.link",
  method: "GET",
  path: `/eth/${newWallet.address}`,
  port: 443
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);

  res.on("data", d => {
    process.stdout.write(d);
    console.log(
      `\nYour request for testnet assets has been submitted and will arrive at the ${newWallet.address} wallet soon.`
    );
  });
});

req.on("error", error => {
  console.error(error);
});

req.end();
