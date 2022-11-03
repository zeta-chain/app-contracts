import hardhat, { network } from "hardhat";

import { getAddress } from "../lib/address.helpers";
import { ZETA_INITIAL_SUPPLY } from "../lib/contracts.constants";
import { isEthNetworkName } from "../lib/contracts.helpers";

/**
 * @description Prevents breaking the execution flow when contract A is verified (so verifying again throws)
 * and contract B isn't yet verified
 */
const handleCatch = (e: any) => e?.message && console.error(e.message);

async function main() {
  if (isEthNetworkName(network.name)) {
    await hardhat
      .run("verify:verify", {
        address: getAddress("zetaToken"),
        constructorArguments: [ZETA_INITIAL_SUPPLY],
        contract: "contracts/evm/Zeta.eth.sol:ZetaEth"
      })
      .catch(handleCatch);

    await hardhat
      .run("verify:verify", {
        address: getAddress("connector"),
        constructorArguments: [getAddress("zetaToken"), getAddress("tss"), getAddress("tssUpdater")],
        contract: "contracts/evm/ZetaConnector.eth.sol:ZetaConnectorEth"
      })
      .catch(handleCatch);
  } else {
    await hardhat
      .run("verify:verify", {
        address: getAddress("zetaToken"),
        constructorArguments: [getAddress("tss"), getAddress("tssUpdater")]
      })
      .catch(handleCatch);

    await hardhat
      .run("verify:verify", {
        address: getAddress("connector"),
        constructorArguments: [getAddress("zetaToken"), getAddress("tss"), getAddress("tssUpdater")],
        contract: "contracts/evm/ZetaConnector.non-eth.sol:ZetaConnectorNonEth"
      })
      .catch(handleCatch);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
