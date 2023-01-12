/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { ethers } from "ethers";
import {
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomiclabs/hardhat-ethers/types";

import * as Contracts from ".";

declare module "hardhat/types/runtime" {
  interface HardhatEthersHelpers extends HardhatEthersHelpersBase {
    getContractFactory(
      name: "Ownable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Ownable__factory>;
    getContractFactory(
      name: "Pausable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Pausable__factory>;
    getContractFactory(
      name: "ERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC20__factory>;
    getContractFactory(
      name: "ERC20Burnable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ERC20Burnable__factory>;
    getContractFactory(
      name: "IERC20Metadata",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20Metadata__factory>;
    getContractFactory(
      name: "IERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20__factory>;
    getContractFactory(
      name: "IUniswapV2Factory",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IUniswapV2Factory__factory>;
    getContractFactory(
      name: "IUniswapV2Pair",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IUniswapV2Pair__factory>;
    getContractFactory(
      name: "IERC20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IERC20__factory>;
    getContractFactory(
      name: "IUniswapV2Router01",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IUniswapV2Router01__factory>;
    getContractFactory(
      name: "IUniswapV2Router02",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IUniswapV2Router02__factory>;
    getContractFactory(
      name: "IWETH",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IWETH__factory>;
    getContractFactory(
      name: "UniswapV2Router02",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.UniswapV2Router02__factory>;
    getContractFactory(
      name: "IUniswapV3SwapCallback",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IUniswapV3SwapCallback__factory>;
    getContractFactory(
      name: "IQuoter",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IQuoter__factory>;
    getContractFactory(
      name: "ISwapRouter",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ISwapRouter__factory>;
    getContractFactory(
      name: "ImmutableCreate2Factory",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ImmutableCreate2Factory__factory>;
    getContractFactory(
      name: "Ownable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Ownable__factory>;
    getContractFactory(
      name: "ConnectorErrors",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ConnectorErrors__factory>;
    getContractFactory(
      name: "ZetaErrors",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaErrors__factory>;
    getContractFactory(
      name: "ZetaInteractorErrors",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaInteractorErrors__factory>;
    getContractFactory(
      name: "ZetaConnector",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaConnector__factory>;
    getContractFactory(
      name: "ZetaReceiver",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaReceiver__factory>;
    getContractFactory(
      name: "ZetaTokenConsumer",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaTokenConsumer__factory>;
    getContractFactory(
      name: "ZetaNonEthInterface",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaNonEthInterface__factory>;
    getContractFactory(
      name: "Ownable2Step",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Ownable2Step__factory>;
    getContractFactory(
      name: "INonfungiblePositionManager",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.INonfungiblePositionManager__factory>;
    getContractFactory(
      name: "IPoolInitializer",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IPoolInitializer__factory>;
    getContractFactory(
      name: "ZetaInteractorMock",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaInteractorMock__factory>;
    getContractFactory(
      name: "ZetaReceiverMock",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaReceiverMock__factory>;
    getContractFactory(
      name: "ZetaEth",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaEth__factory>;
    getContractFactory(
      name: "ZetaNonEth",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaNonEth__factory>;
    getContractFactory(
      name: "ZetaConnectorBase",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaConnectorBase__factory>;
    getContractFactory(
      name: "ZetaConnectorEth",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaConnectorEth__factory>;
    getContractFactory(
      name: "ZetaConnectorNonEth",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaConnectorNonEth__factory>;
    getContractFactory(
      name: "ZetaInteractor",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaInteractor__factory>;
    getContractFactory(
      name: "ZetaTokenConsumerUniV2",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaTokenConsumerUniV2__factory>;
    getContractFactory(
      name: "ZetaTokenConsumerUniV2Errors",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaTokenConsumerUniV2Errors__factory>;
    getContractFactory(
      name: "WETH9",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.WETH9__factory>;
    getContractFactory(
      name: "ZetaTokenConsumerUniV3",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaTokenConsumerUniV3__factory>;
    getContractFactory(
      name: "ZetaTokenConsumerUniV3Errors",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.ZetaTokenConsumerUniV3Errors__factory>;

    getContractAt(
      name: "Ownable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Ownable>;
    getContractAt(
      name: "Pausable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Pausable>;
    getContractAt(
      name: "ERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC20>;
    getContractAt(
      name: "ERC20Burnable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ERC20Burnable>;
    getContractAt(
      name: "IERC20Metadata",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20Metadata>;
    getContractAt(
      name: "IERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20>;
    getContractAt(
      name: "IUniswapV2Factory",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IUniswapV2Factory>;
    getContractAt(
      name: "IUniswapV2Pair",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IUniswapV2Pair>;
    getContractAt(
      name: "IERC20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IERC20>;
    getContractAt(
      name: "IUniswapV2Router01",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IUniswapV2Router01>;
    getContractAt(
      name: "IUniswapV2Router02",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IUniswapV2Router02>;
    getContractAt(
      name: "IWETH",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IWETH>;
    getContractAt(
      name: "UniswapV2Router02",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.UniswapV2Router02>;
    getContractAt(
      name: "IUniswapV3SwapCallback",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IUniswapV3SwapCallback>;
    getContractAt(
      name: "IQuoter",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IQuoter>;
    getContractAt(
      name: "ISwapRouter",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ISwapRouter>;
    getContractAt(
      name: "ImmutableCreate2Factory",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ImmutableCreate2Factory>;
    getContractAt(
      name: "Ownable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Ownable>;
    getContractAt(
      name: "ConnectorErrors",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ConnectorErrors>;
    getContractAt(
      name: "ZetaErrors",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaErrors>;
    getContractAt(
      name: "ZetaInteractorErrors",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaInteractorErrors>;
    getContractAt(
      name: "ZetaConnector",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaConnector>;
    getContractAt(
      name: "ZetaReceiver",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaReceiver>;
    getContractAt(
      name: "ZetaTokenConsumer",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaTokenConsumer>;
    getContractAt(
      name: "ZetaNonEthInterface",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaNonEthInterface>;
    getContractAt(
      name: "Ownable2Step",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Ownable2Step>;
    getContractAt(
      name: "INonfungiblePositionManager",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.INonfungiblePositionManager>;
    getContractAt(
      name: "IPoolInitializer",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IPoolInitializer>;
    getContractAt(
      name: "ZetaInteractorMock",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaInteractorMock>;
    getContractAt(
      name: "ZetaReceiverMock",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaReceiverMock>;
    getContractAt(
      name: "ZetaEth",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaEth>;
    getContractAt(
      name: "ZetaNonEth",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaNonEth>;
    getContractAt(
      name: "ZetaConnectorBase",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaConnectorBase>;
    getContractAt(
      name: "ZetaConnectorEth",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaConnectorEth>;
    getContractAt(
      name: "ZetaConnectorNonEth",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaConnectorNonEth>;
    getContractAt(
      name: "ZetaInteractor",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaInteractor>;
    getContractAt(
      name: "ZetaTokenConsumerUniV2",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaTokenConsumerUniV2>;
    getContractAt(
      name: "ZetaTokenConsumerUniV2Errors",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaTokenConsumerUniV2Errors>;
    getContractAt(
      name: "WETH9",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.WETH9>;
    getContractAt(
      name: "ZetaTokenConsumerUniV3",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaTokenConsumerUniV3>;
    getContractAt(
      name: "ZetaTokenConsumerUniV3Errors",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.ZetaTokenConsumerUniV3Errors>;

    // default types
    getContractFactory(
      name: string,
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<ethers.ContractFactory>;
    getContractFactory(
      abi: any[],
      bytecode: ethers.utils.BytesLike,
      signer?: ethers.Signer
    ): Promise<ethers.ContractFactory>;
    getContractAt(
      nameOrAbi: string | any[],
      address: string,
      signer?: ethers.Signer
    ): Promise<ethers.Contract>;
  }
}
