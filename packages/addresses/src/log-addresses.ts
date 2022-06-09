import { getExplorerUrl, getTestnetList, isZetaNetworkName, ZetaTestnetNetworkName } from "./addresses.helpers";

const network = process.argv[2];

const toFilter = process.argv[3].split(",").map((w) => w.toLowerCase());

if (!isZetaNetworkName(network)) {
  console.error(`Invalid network (${network}).`);
  process.exit(1);
}

const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const logAddresses = (zetaNetwork: ZetaTestnetNetworkName) => {
  const list = getTestnetList()[zetaNetwork];

  console.log(`${capitalizeFirstLetter(zetaNetwork)} addresses:`);

  Object.entries(list).map(([networkName, addresses], i) => {
    console.log(`--- ${capitalizeFirstLetter(networkName)} ---`);

    Object.entries(addresses).map(([name, address]) => {
      if (toFilter.includes(name.toLowerCase())) return;
      if (!address) return;

      console.log(
        `${capitalizeFirstLetter(name)}: [${address}](${getExplorerUrl({
          customNetworkName: networkName,
        })}address/${address})`
      );
    });

    console.log("\n");
  });
};

logAddresses("athens");
