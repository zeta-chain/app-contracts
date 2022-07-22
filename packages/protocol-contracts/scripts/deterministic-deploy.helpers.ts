import { getAddress } from "@zetachain/addresses";
import { BigNumber } from "ethers";

import { MAX_ETH_ADDRESS } from "../lib/contracts.constants";
import {
  buildBytecode,
  buildCreate2Address,
  saltToHex,
} from "../lib/ImmutableCreate2Factory/ImmutableCreate2Factory.helpers";

export const calculateBestSalt = async (
  maxIterations: BigNumber,
  deployerAddress: string,
  constructorTypes: string[],
  constructorArgs: string[],
  contractBytecode: string
) => {
  const immutableCreate2Factory = getAddress("immutableCreate2Factory");

  let minAddress = MAX_ETH_ADDRESS;
  let minAddressSalt = "";
  let minIndex = BigNumber.from(0);

  for (let i = BigNumber.from(0); i.lt(maxIterations); i = i.add(BigNumber.from(1))) {
    const saltStr = i.toHexString();
    const salthex = saltToHex(saltStr, deployerAddress);

    const bytecode = buildBytecode(constructorTypes, constructorArgs, contractBytecode);
    const expectedAddress = buildCreate2Address(salthex, bytecode, immutableCreate2Factory);
    if (expectedAddress < minAddress) {
      minAddress = expectedAddress;
      minAddressSalt = saltStr;
      minIndex = i;
      console.log(minAddress, minAddressSalt, i.toString());
    }
    if (i.mod(10000).isZero()) {
      console.log("step", i.toString());
    }
  }

  console.log(minAddress, minAddressSalt, minIndex.toString());
};
