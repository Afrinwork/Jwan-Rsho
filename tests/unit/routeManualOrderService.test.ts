import test from "node:test";
import assert from "node:assert/strict";

import { applyManualOrder, mergeRouteOrder, moveIdToPosition } from "@/src/features/route/services/routeManualOrderService";

const ids = Array.from({ length: 16 }, (_, index) => `c${index + 1}`);

test("moveIdToPosition moves customer 3 to position 15, keeping the others' order", () => {
  const result = moveIdToPosition(ids, "c3", 15);
  assert.equal(result.indexOf("c3"), 14);
  assert.deepEqual(result.filter((id) => id !== "c3"), ids.filter((id) => id !== "c3"));
});

test("moveIdToPosition moves a stop forward", () => {
  assert.deepEqual(moveIdToPosition(["a", "b", "c", "d"], "d", 2), ["a", "d", "b", "c"]);
});

test("moveIdToPosition clamps out-of-range positions", () => {
  assert.deepEqual(moveIdToPosition(["a", "b", "c"], "a", 99), ["b", "c", "a"]);
  assert.deepEqual(moveIdToPosition(["a", "b", "c"], "c", 0), ["c", "a", "b"]);
});

test("moveIdToPosition returns the same array for a no-op or an unknown id", () => {
  const list = ["a", "b", "c"];
  assert.equal(moveIdToPosition(list, "b", 2), list);
  assert.equal(moveIdToPosition(list, "x", 1), list);
  assert.equal(moveIdToPosition(list, "a", Number.NaN), list);
});

test("applyManualOrder follows the manual order, drops vanished ids and appends unknown points", () => {
  const point = (id: string) => ({ id, latitude: 0, longitude: 0 });
  const result = applyManualOrder([point("a"), point("b"), point("c"), point("new")], ["c", "gone", "a", "b"]);
  assert.deepEqual(result.map((value) => value.id), ["c", "a", "b", "new"]);
});

test("mergeRouteOrder puts the newly sorted ids first and keeps the rest of the saved list", () => {
  assert.deepEqual(mergeRouteOrder(["x", "a", "y", "b"], ["b", "a"]), ["b", "a", "x", "y"]);
  assert.deepEqual(mergeRouteOrder(null, ["b", "a"]), ["b", "a"]);
});

test("mergeRouteOrder caps the saved list size", () => {
  const saved = Array.from({ length: 2500 }, (_, index) => `s${index}`);
  assert.equal(mergeRouteOrder(saved, ["a"]).length, 2000);
});
