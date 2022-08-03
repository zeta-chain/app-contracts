/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  ZetaTokenConsumerUniV3Errors,
  ZetaTokenConsumerUniV3ErrorsInterface,
} from "../../../contracts/ZetaTokenConsumerUniV3.strategy.sol/ZetaTokenConsumerUniV3Errors";

const _abi = [
  {
    inputs: [],
    name: "ErrorSendingETH",
    type: "error",
  },
  {
    inputs: [],
    name: "InputCantBeZero",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAddress",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyError",
    type: "error",
  },
];

export class ZetaTokenConsumerUniV3Errors__factory {
  static readonly abi = _abi;
  static createInterface(): ZetaTokenConsumerUniV3ErrorsInterface {
    return new utils.Interface(_abi) as ZetaTokenConsumerUniV3ErrorsInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ZetaTokenConsumerUniV3Errors {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as ZetaTokenConsumerUniV3Errors;
  }
}
