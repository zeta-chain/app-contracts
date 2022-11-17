/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
} from "../../common";

export interface ImmutableCreate2FactoryInterface extends utils.Interface {
  functions: {
    "hasBeenDeployed(address)": FunctionFragment;
    "safeCreate2(bytes32,bytes)": FunctionFragment;
    "findCreate2Address(bytes32,bytes)": FunctionFragment;
    "findCreate2AddressViaHash(bytes32,bytes32)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "hasBeenDeployed"
      | "safeCreate2"
      | "findCreate2Address"
      | "findCreate2AddressViaHash"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "hasBeenDeployed",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "safeCreate2",
    values: [BytesLike, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "findCreate2Address",
    values: [BytesLike, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "findCreate2AddressViaHash",
    values: [BytesLike, BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "hasBeenDeployed",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "safeCreate2",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "findCreate2Address",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "findCreate2AddressViaHash",
    data: BytesLike
  ): Result;

  events: {};
}

export interface ImmutableCreate2Factory extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ImmutableCreate2FactoryInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    hasBeenDeployed(
      deploymentAddress: string,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    safeCreate2(
      salt: BytesLike,
      initializationCode: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    findCreate2Address(
      salt: BytesLike,
      initCode: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string] & { deploymentAddress: string }>;

    findCreate2AddressViaHash(
      salt: BytesLike,
      initCodeHash: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string] & { deploymentAddress: string }>;
  };

  hasBeenDeployed(
    deploymentAddress: string,
    overrides?: CallOverrides
  ): Promise<boolean>;

  safeCreate2(
    salt: BytesLike,
    initializationCode: BytesLike,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  findCreate2Address(
    salt: BytesLike,
    initCode: BytesLike,
    overrides?: CallOverrides
  ): Promise<string>;

  findCreate2AddressViaHash(
    salt: BytesLike,
    initCodeHash: BytesLike,
    overrides?: CallOverrides
  ): Promise<string>;

  callStatic: {
    hasBeenDeployed(
      deploymentAddress: string,
      overrides?: CallOverrides
    ): Promise<boolean>;

    safeCreate2(
      salt: BytesLike,
      initializationCode: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    findCreate2Address(
      salt: BytesLike,
      initCode: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    findCreate2AddressViaHash(
      salt: BytesLike,
      initCodeHash: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;
  };

  filters: {};

  estimateGas: {
    hasBeenDeployed(
      deploymentAddress: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    safeCreate2(
      salt: BytesLike,
      initializationCode: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    findCreate2Address(
      salt: BytesLike,
      initCode: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    findCreate2AddressViaHash(
      salt: BytesLike,
      initCodeHash: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    hasBeenDeployed(
      deploymentAddress: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    safeCreate2(
      salt: BytesLike,
      initializationCode: BytesLike,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    findCreate2Address(
      salt: BytesLike,
      initCode: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    findCreate2AddressViaHash(
      salt: BytesLike,
      initCodeHash: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
