import { assert, expect } from "chai";
import { describe } from "mocha";

import { bsc, eth, polygon, zeta } from "./lib/environments";

// The following two lines disable debug and info logging - comment them out to enable
console.debug = function () {}; // Disables Debug Level Logging
// console.info = function () {}; // Disables Info Level Logging

let approvalTest: any;
let transferTest: any;
let messageSendTest: any;
let txMiningTest: any;
let zetaNodeReceiveTest: any;

// Start Mocha Tests Here Calling Test Functions in Parallel
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

    messageSendTest = await Promise.all([
      eth.sendConnectorMessage(bsc, false),
      // eth.sendConnectorMessage(polygon, true),
      // bsc.sendConnectorMessage(eth, false),
      // bsc.sendConnectorMessage(polygon, true),
      // polygon.sendConnectorMessage(eth, false),
      // polygon.sendConnectorMessage(bsc, true),
    ]);
    await messageSendTest;
  });

  it("Connector Message Events are detected by ZetaNode", async () => {
    await messageSendTest;
    zetaNodeReceiveTest = await Promise.all([
      zeta.getTxWithHash(messageSendTest[0].hash),
      // zeta.getTxWithHash(messageSendTest[1].hash),
      // zeta.getTxWithHash(messageSendTest[2].hash),
      // zeta.getTxWithHash(messageSendTest[3].hash),
      // zeta.getTxWithHash(messageSendTest[4].hash),
      // zeta.getTxWithHash(messageSendTest[5].hash),
    ]);
    await zetaNodeReceiveTest;
    // console.info(zetaNodeReceiveTest[0]);
  });

  it("Connector Messages are transitioning to OutboundMined status", async () => {
    await zetaNodeReceiveTest;
    txMiningTest = await Promise.all([
      zeta.confirmOutboundMined(zetaNodeReceiveTest[0].index),
      // zeta.confirmOutboundMined(zetaNodeReceiveTest[1].index),
      // zeta.confirmOutboundMined(zetaNodeReceiveTest[2].index),
      // zeta.confirmOutboundMined(zetaNodeReceiveTest[3].index),
      // zeta.confirmOutboundMined(zetaNodeReceiveTest[4].index),
      // zeta.confirmOutboundMined(zetaNodeReceiveTest[5].index),
    ]);
    await txMiningTest;
  });
});
