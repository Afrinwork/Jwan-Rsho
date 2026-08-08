import test from "node:test";
import assert from "node:assert/strict";

import { guardAsync } from "@/src/utils/guardAsync";

test("Speichern-Button gegen Doppelklick: concurrent calls only run once", async () => {
  let callCount = 0;
  const guarded = guardAsync(async () => {
    callCount += 1;
    return "done";
  });

  const [first, second] = await Promise.all([guarded(), guarded()]);

  assert.equal(callCount, 1);
  assert.equal(first, "done");
  assert.equal(second, "done");
});

test("guardAsync allows a new call once the previous one settles", async () => {
  let callCount = 0;
  const guarded = guardAsync(async () => {
    callCount += 1;
    return callCount;
  });

  await guarded();
  await guarded();

  assert.equal(callCount, 2);
});
