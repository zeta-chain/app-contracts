import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network } from "hardhat";

import { InstantRewardsFactory, InstantRewardsFactory__factory } from "../../typechain-types";
import { instantRewards } from "../../typechain-types/contracts";
import { saveAddress } from "../address.helpers";
import { verifyContract } from "../explorer.helpers";

const networkName = network.name;

const OWNERS = {
  zeta_mainnet: "0xD7E8bD37db625a4856E056D2617C9d140dB99182",
  zeta_testnet: "0x1d24d94520B94B26351f6573de5ef9731c48531A",
};

//@ts-ignore
const owner = OWNERS[networkName];
console.log("Owner:", owner);

const deployInstantRewardsSample = async (instantRewardsFactoryAddress: string) => {
  const [deployer] = await ethers.getSigners();

  const InstantRewardsFactory = new InstantRewardsFactory__factory(deployer);
  const instantRewards = InstantRewardsFactory.attach(instantRewardsFactoryAddress);

  // get current timestamp from ethers
  const block = await ethers.provider.getBlock("latest");
  const timestamp = block.timestamp;
  const start = timestamp + 60 * 60 * 24 * 7; // 1 week from now
  const end = start + 60 * 60 * 24 * 7 * 4; // 4 weeks from start

  const params = [
    owner,
    start,
    end,
    "ZetaChain",
    "https://zetachain.io",
    "https://zetachain.io/logo.png",
    "ZetaChain description",
  ];

  const tx = await instantRewards.createInstantRewards(...params, {
    gasLimit: 25000000,
  });

  const rec = await tx.wait();

  // query event InstantRewardsCreated to get the address
  const event = rec.events?.find((event) => event.event === "InstantRewardsCreated");

  if (!event) throw new Error("InstantRewardsCreated event not found");
  //@ts-ignore
  const instantRewardsAddress = event.args[0];
  if (!instantRewardsAddress) throw new Error("InstantRewards address not found");
  console.log("InstantRewards deployed to:", instantRewardsAddress);

  await verifyContract(
    instantRewardsAddress,
    [owner, ...params],
    "contracts/instant-rewards/InstantRewardsV2.sol:InstantRewardsV2"
  );
};

const deployInstantRewards = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");

  const InstantRewardsFactory = (await ethers.getContractFactory(
    "InstantRewardsFactory"
  )) as InstantRewardsFactory__factory;
  const instantRewards = await InstantRewardsFactory.deploy(owner);

  await instantRewards.deployed();

  console.log("InstantRewards deployed to:", instantRewards.address);

  saveAddress("InstantRewardsFactory", instantRewards.address, networkName);

  await verifyContract(instantRewards.address, [owner]);
  // await verifyContract("0xAf5693bBC958e442462F411F46421e389c7A8602", [owner]);

  return instantRewards;
};

const main = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  const instantRewards = await deployInstantRewards();
  await deployInstantRewardsSample(instantRewards.address);
  // await deployInstantRewardsSample("0x3A557fe83FD734f21DD35E98f546B9706d486F55");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
