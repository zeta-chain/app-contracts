import { addNewAddress } from "../addresses.helpers";

const name = process.argv[2];

if (!name) {
  console.log("Usage: 'ts-node src/add-new-address <address-name>'.");
  process.exit(1);
}

addNewAddress(name);
