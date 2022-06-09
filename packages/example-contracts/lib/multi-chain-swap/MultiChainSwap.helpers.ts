import {
  MultiChainSwapBase,
  MultiChainSwapBase__factory as MultiChainSwapBaseFactory,
  MultiChainSwapZetaConnector,
  MultiChainSwapZetaConnector__factory,
} from "../../typechain-types";
import { getContract, GetContractParams } from "../shared/deploy.helpers";

export const getMultiChainSwapBase = async (params: GetContractParams<MultiChainSwapBaseFactory>) =>
  getContract<MultiChainSwapBaseFactory, MultiChainSwapBase>({
    contractName: "MultiChainSwapBase",
    ...params,
  });

export const getMultiChainSwapZetaConnector = async (zetaToken: string) =>
  getContract<MultiChainSwapZetaConnector__factory, MultiChainSwapZetaConnector>({
    contractName: "MultiChainSwapZetaConnector",
    deployParams: [zetaToken],
  });
