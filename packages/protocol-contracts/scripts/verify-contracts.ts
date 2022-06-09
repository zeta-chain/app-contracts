import { getAddress } from "@zetachain/addresses";
import hardhat, { network } from "hardhat";

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
        contract: "contracts/evm/ZetaEth.sol:ZetaEth",
        constructorArguments: [ZETA_INITIAL_SUPPLY],
      })
      .catch(handleCatch);

    await hardhat
      .run("verify:verify", {
        address: getAddress("connector"),
        contract: "contracts/evm/ZetaConnector.eth.sol:ZetaConnectorEth",
        constructorArguments: [getAddress("zetaToken"), getAddress("tss"), getAddress("tssUpdater")],
      })
      .catch(handleCatch);
  } else {
    await hardhat
      .run("verify:verify", {
        address: getAddress("zetaToken"),
        constructorArguments: [0, getAddress("tss"), getAddress("tssUpdater")],
      })
      .catch(handleCatch);

    await hardhat
      .run("verify:verify", {
        address: getAddress("connector"),
        contract: "contracts/evm/ZetaConnector.non-eth.sol:ZetaConnectorNonEth",
        constructorArguments: [getAddress("zetaToken"), getAddress("tss"), getAddress("tssUpdater")],
      })
      .catch(handleCatch);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
