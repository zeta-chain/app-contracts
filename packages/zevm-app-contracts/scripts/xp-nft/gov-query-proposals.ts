import { isProtocolNetworkName } from "@zetachain/protocol-contracts";
import { ethers, network } from "hardhat";

import { getZEVMAppAddress } from "../address.helpers";

const networkName = network.name;

const callGov = async () => {
  const govAddress = getZEVMAppAddress("ZetaXPGov", networkName);
  console.log("ZetaXPGov address:", govAddress);

  const ZetaXPGovFactory = await ethers.getContractFactory("ZetaXPGov");
  const zetaGov = await ZetaXPGovFactory.attach(govAddress);

  const start = 7426910 - 1;
  const end = 7441292 + 1;
  for (let i = start; i < end; i += 1000) {
    const proposalIds = await zetaGov.queryFilter(zetaGov.filters.ProposalCreated(), i, i + 1000);
    if (proposalIds.length > 0) {
      for (let j = 0; j < proposalIds.length; j++) {
        const proposalId = proposalIds[j].proposalId;
        const votes = await zetaGov.proposalVotes(proposalId);
        console.log("Proposal ID:", proposalId);
        console.log("Votes:", votes);
      }
    }
  }
};

const main = async () => {
  if (!isProtocolNetworkName(networkName)) throw new Error("Invalid network name");
  await callGov();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
