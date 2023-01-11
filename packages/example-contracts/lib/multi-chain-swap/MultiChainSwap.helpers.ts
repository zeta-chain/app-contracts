import {
  MultiChainSwapUniV2,
  MultiChainSwapUniV2__factory as MultiChainSwapUniV2Factory,
  MultiChainSwapUniV3,
  MultiChainSwapUniV3__factory as MultiChainSwapUniV3Factory,
  MultiChainSwapZetaConnector,
  MultiChainSwapZetaConnector__factory
} from "../../typechain-types";
import { MultiChainSwapTrident } from "../../typechain-types/contracts/multi-chain-swap/MultiChainSwapTrident.strategy.sol";
import { MultiChainSwapTrident__factory } from "../../typechain-types/factories/contracts/multi-chain-swap/MultiChainSwapTrident.strategy.sol";
import { getContract, GetContractParams } from "../shared/deploy.helpers";

export const getMultiChainSwapUniV2 = async (params: GetContractParams<MultiChainSwapUniV2Factory>) =>
  getContract<MultiChainSwapUniV2Factory, MultiChainSwapUniV2>({
    contractName: "MultiChainSwapUniV2",
    ...params
  });

export const getMultiChainSwapUniV3 = async (params: GetContractParams<MultiChainSwapUniV3Factory>) =>
  getContract<MultiChainSwapUniV3Factory, MultiChainSwapUniV3>({
    contractName: "MultiChainSwapUniV3",
    ...params
  });

export const getMultiChainSwapTrident = async (params: GetContractParams<MultiChainSwapTrident__factory>) =>
  getContract<MultiChainSwapTrident__factory, MultiChainSwapTrident>({
    contractName: "MultiChainSwapTrident",
    ...params
  });

export const getMultiChainSwapZetaConnector = async (zetaToken: string) =>
  getContract<MultiChainSwapZetaConnector__factory, MultiChainSwapZetaConnector>({
    contractName: "MultiChainSwapZetaConnector",
    deployParams: [zetaToken]
  });
