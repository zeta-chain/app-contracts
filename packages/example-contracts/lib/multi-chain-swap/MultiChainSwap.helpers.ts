import {
  MultiChainSwapUniV2,
  MultiChainSwapUniV2__factory as MultiChainSwapUniV2Factory,
  MultiChainSwapZetaConnector,
  MultiChainSwapZetaConnector__factory
} from "../../typechain-types";
import { getContract, GetContractParams } from "../shared/deploy.helpers";

export const getMultiChainSwapUniV2 = async (params: GetContractParams<MultiChainSwapUniV2Factory>) =>
  getContract<MultiChainSwapUniV2Factory, MultiChainSwapUniV2>({
    contractName: "MultiChainSwapUniV2",
    ...params
  });

export const getMultiChainSwapZetaConnector = async (zetaToken: string) =>
  getContract<MultiChainSwapZetaConnector__factory, MultiChainSwapZetaConnector>({
    contractName: "MultiChainSwapZetaConnector",
    deployParams: [zetaToken]
  });
