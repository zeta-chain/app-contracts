import { BigNumber, ContractReceipt } from "ethers";

import { IUniswapV2Pair__factory, MultiChainSwapBase__factory } from "../typechain-types";

export const getMintTokenId = (mintTx: ContractReceipt) => mintTx.events?.[0].args?.tokenId;

export const parseUniswapLog = (logs: ContractReceipt["logs"]) => {
  const iface = IUniswapV2Pair__factory.createInterface();

  const eventNames = logs.map((log) => {
    try {
      const parsedLog = iface.parseLog(log);

      return parsedLog.name;
    } catch (e: any) {
      return "NO_UNI_LOG";
    }
  });

  return eventNames;
};

export const parseZetaLog = (logs: ContractReceipt["logs"]) => {
  const iface = MultiChainSwapBase__factory.createInterface();

  const eventNames = logs.map((log) => {
    try {
      const parsedLog = iface.parseLog(log);

      return parsedLog.name;
    } catch (e: any) {
      return "NO_ZETA_LOG";
    }
  });

  return eventNames;
};

type CustomErrorParamType = BigNumber | number | string;
export const getCustomErrorMessage = (errorMethod: string, params?: [CustomErrorParamType]) => {
  const stringParams = params
    ? params
        .map((p: CustomErrorParamType) => {
          if (typeof p === "number") {
            return p;
          }

          return `"${p.toString()}"`;
        })
        .join(", ")
    : "";
  return `VM Exception while processing transaction: reverted with custom error '${errorMethod}(${stringParams})'`;
};
