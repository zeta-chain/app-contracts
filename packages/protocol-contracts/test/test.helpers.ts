import { ZetaTokenConsumer__factory } from "@zetachain/interfaces/typechain-types";
import { BigNumber, ContractReceipt } from "ethers";

export const parseZetaConsumerLog = (logs: ContractReceipt["logs"]) => {
  const iface = ZetaTokenConsumer__factory.createInterface();

  const eventNames = logs.map(log => {
    try {
      const parsedLog = iface.parseLog(log);

      return parsedLog.name;
    } catch (e) {
      return "NO_ZETA_LOG";
    }
  });

  return eventNames;
};
