const { web3 } = require("hardhat");

const { assert } = require("chai");

const {
  assertEventEqual,
  assertEventsEqual,
  assertBNEqual,
  assertBNNotEqual,
  assertBNClose,
  assertBNGreaterEqualThan,
  assertBNGreaterThan,
  assertBNLessEqualThan,
  assertBNLessThan,
  assertDeepEqual,
  assertInvalidOpcode,
  assertUnitEqual,
  assertUnitNotEqual,
  assertRevert,
  fromUnit,
  takeSnapshot,
  restoreSnapshot,
} = require("./utils")();

let lastSnapshotId;

module.exports = {
  addSnapshotBeforeRestoreAfter() {
    before(async () => {
      lastSnapshotId = await takeSnapshot();
    });

    after(async () => {
      await restoreSnapshot(lastSnapshotId);
    });
  },

  // And this is our test sandboxing. It snapshots and restores between each test.
  // Note: if a test suite uses fastForward at all, then it MUST also use these snapshots,
  // otherwise it will update the block time of the EVM and future tests that expect a
  // starting timestamp will fail.
  addSnapshotBeforeRestoreAfterEach() {
    beforeEach(async () => {
      lastSnapshotId = await takeSnapshot();
    });

    afterEach(async () => {
      await restoreSnapshot(lastSnapshotId);
    });
  },

  // So we don't have to constantly import our assert helpers everywhere
  // we'll just tag them onto the assert object for easy access.
  assert: Object.assign({}, assert, {
    bnClose: assertBNClose,
    bnEqual: assertBNEqual,
    bnGt: assertBNGreaterThan,
    bnGte: assertBNGreaterEqualThan,
    bnLt: assertBNLessThan,
    bnLte: assertBNLessEqualThan,
    bnNotEqual: assertBNNotEqual,
    deepEqual: assertDeepEqual,
    etherEqual: assertUnitEqual,
    etherNotEqual: assertUnitNotEqual,
    eventEqual: assertEventEqual,
    eventsEqual: assertEventsEqual,
    invalidOpcode: assertInvalidOpcode,
    revert: assertRevert,
    unitEqual: assertUnitEqual,
    unitNotEqual: assertUnitNotEqual,
  }),
};
