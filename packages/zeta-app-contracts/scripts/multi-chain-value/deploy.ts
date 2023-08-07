import { getChainId, isNetworkName, isZetaTestnet, NetworkName } from "@zetachain/addresses";
import { getProtocolNetwork, saveAddress } from "@zetachain/addresses-tools";
import { getAddress } from "@zetachain/protocol-contracts/dist/lib";
import { ethers, network } from "hardhat";

import { MultiChainValue, MultiChainValue__factory } from "../../typechain-types";

const networkName = network.name;
const { ZETA_NETWORK } = process.env;

async function main() {
  if (!isNetworkName(networkName)) throw new Error("Invalid network name");

  const protocolNetwork = getProtocolNetwork(networkName);
  if (!protocolNetwork) throw new Error("Invalid network name");

  const connectorAddress = getAddress("connector", protocolNetwork);
  const zetaTokenAddress = getAddress("zetaToken", protocolNetwork);

  const Factory = (await ethers.getContractFactory("MultiChainValue")) as MultiChainValue__factory;
  const contract = (await Factory.deploy(connectorAddress, zetaTokenAddress)) as MultiChainValue;
  await contract.deployed();

  console.log("MultiChainValue deployed to:", contract.address);

  if (isZetaTestnet(ZETA_NETWORK)) {
    networkName !== "goerli" &&
      (await (await contract.addAvailableChainId(getChainId("goerli"))).wait().catch((e: any) => console.error(e)));

    networkName !== "polygon-mumbai" &&
      (await (await contract.addAvailableChainId(getChainId("polygon-mumbai")))
        .wait()
        .catch((e: any) => console.error(e)));

    networkName !== "bsc-testnet" &&
      (await (await contract.addAvailableChainId(getChainId("bsc-testnet")))
        .wait()
        .catch((e: any) => console.error(e)));

    networkName !== "athens" &&
      (await (await contract.addAvailableChainId(getChainId("athens"))).wait().catch((e: any) => console.error(e)));
  }

  saveAddress("multiChainValue", contract.address);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
