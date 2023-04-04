// wallet.js
const fs = require("fs");

const ethers = require("ethers");
const newWallet = ethers.Wallet.createRandom();

console.log(`Your New Address:${newWallet.address}`);
console.log(`Your Private Key: ${newWallet.privateKey.substring(2)}`);

// console.log("");
// console.log("Now enter the following command in your console");
// console.log(`export PRIVATE_KEY=${newWallet.privateKey.substring(2)}`);

const value = `\nPRIVATE_KEY=${newWallet.privateKey.substring(
  2
)}\nZETA_NETWORK=athens\nEXECUTE_PROGRAMMATICALLY=true npx hardhat run scripts/zeta-swap/deploy.ts --network athens`;
const filePaths = ["packages/example-contracts/.env", "packages/zevm-example-contracts/.env"];

filePaths.forEach(filePath => {
  fs.writeFile(filePath, value, err => {
    if (err) {
      console.error(`Failed to write to file ${filePath}: ${err}`);
    } else {
      console.log(`Value "${value}" has been added to the .env file "${filePath}".`);
    }
  });
});
