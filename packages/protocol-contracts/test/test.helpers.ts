import { BigNumber, ContractReceipt } from "ethers";

import { ZetaTokenConsumer__factory } from "../typechain-types";

type CustomErrorParamType = string | BigNumber | number;
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

export const parseZetaConsumerLog = (logs: ContractReceipt["logs"]) => {
  const iface = ZetaTokenConsumer__factory.createInterface();

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
