import { assert, expect } from "chai";
import { ContractTransaction } from "ethers";
import { describe } from "mocha";

import { bsc, eth, polygon, zeta } from "./lib/environments";

// The following two lines disable debug and info logging - comment them out to enable
console.debug = function () {}; // Disables Debug Level Logging
// console.info = function () {}; // Disables Info Level Logging

let approvalTest: any;
let transferTest: any;
let messageSendTest: Promise<ContractTransaction[]>;
let txMiningTest: any;
let zetaNodeReceiveTest: Promise<{ index: string }[]>;

describe("Remote TestNet Testing", () => {
  it("Check RPC Endpoints are responding", async () => {
    for (const network of [eth, bsc, polygon]) {
      await network.initStatus;
      const response = await network.api.post("/", {
        method: "eth_blockNumber",
      });
      assert.equal(response.status, 200);
    }
    const zetaResponse = await zeta.api.get("/receive");
    assert.equal(zetaResponse.status, 200);
  });

  it("Connector contract can send() messages", async () => {
    await transferTest;
    await eth.initStatus;
    messageSendTest = Promise.all([
      eth.sendConnectorMessage(bsc, false),
      eth.sendConnectorMessage(polygon, true),
      bsc.sendConnectorMessage(eth, false),
      bsc.sendConnectorMessage(polygon, true),
      polygon.sendConnectorMessage(eth, false),
      polygon.sendConnectorMessage(bsc, true),
    ]);
  });

  it("Connector Message Events are detected by ZetaNode", async () => {
    const messageSendTestResult = await messageSendTest;

    zetaNodeReceiveTest = Promise.all(messageSendTestResult.map(({ hash }) => zeta.getTxWithHash(hash)));
  });

  it("Connector Messages are transitioning to OutboundMined status", async () => {
    const zetaNodeReceiveTestResult = await zetaNodeReceiveTest;

    txMiningTest = await Promise.all(zetaNodeReceiveTestResult.map(({ index }) => zeta.confirmOutboundMined(index)));

    await txMiningTest;
  });
});
