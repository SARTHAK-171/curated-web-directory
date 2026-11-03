// Run with: node --experimental-default-type=module tests/saved.test.mjs
import assert from "node:assert/strict";
import { createSavedStore } from "../assets/js/saved-resources.js";

function makeStorage(initial = null) {
  const values = new Map();
  if (initial !== null) values.set("orbit.savedResourceIds.v1", initial);
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    snapshot(key = "orbit.savedResourceIds.v1") { return values.get(key) ?? null; },
  };
}

const validIds = new Set(["alpha", "beta", "gamma"]);
const storage = makeStorage();
const store = createSavedStore(storage);

assert.deepEqual(store.read(validIds), [], "An empty store should return an empty list.");
assert.equal(store.count(validIds), 0, "An empty store count should be zero.");

const savedAlpha = store.toggle("alpha", validIds);
assert.equal(savedAlpha.ok, true);
assert.equal(savedAlpha.isSaved, true);
assert.deepEqual(savedAlpha.ids, ["alpha"]);
assert.equal(storage.snapshot(), '["alpha"]', "Only the stable resource ID should be persisted.");

// A fresh store using the same storage simulates a page refresh/restart.
const afterRefresh = createSavedStore(storage);
assert.deepEqual(afterRefresh.read(validIds), ["alpha"]);
assert.equal(afterRefresh.count(validIds), 1);

const savedBeta = afterRefresh.toggle("beta", validIds);
assert.deepEqual(savedBeta.ids, ["alpha", "beta"]);
const removedAlpha = afterRefresh.toggle("alpha", validIds);
assert.equal(removedAlpha.isSaved, false);
assert.deepEqual(removedAlpha.ids, ["beta"]);

const invalidResource = afterRefresh.toggle("deleted-resource", validIds);
assert.equal(invalidResource.ok, false);
assert.equal(invalidResource.reason, "unknown-resource");

storage.setItem("orbit.savedResourceIds.v1", '["beta","deleted-resource","beta",42,null]');
assert.deepEqual(afterRefresh.read(validIds), ["beta"], "Unknown IDs, invalid values and duplicates must be discarded.");
assert.equal(storage.snapshot(), '["beta"]', "Cleaned data should replace stale stored IDs.");

storage.setItem("orbit.savedResourceIds.v1", "{not valid JSON");
assert.deepEqual(afterRefresh.read(validIds), [], "Corrupted JSON should safely produce an empty list.");
assert.equal(storage.snapshot(), null, "Corrupted storage should be cleared when possible.");

const blockedStorage = {
  getItem() { throw new Error("Storage blocked"); },
  setItem() { throw new Error("Storage blocked"); },
  removeItem() { throw new Error("Storage blocked"); },
};
const blockedStore = createSavedStore(blockedStorage);
assert.deepEqual(blockedStore.read(validIds), []);
assert.equal(blockedStore.toggle("alpha", validIds).ok, false, "Blocked storage should not pretend that a save succeeded.");

assert.equal(createSavedStore(null).toggle("alpha", validIds).ok, false, "Missing storage must fail gracefully.");
console.log("PASS: Save, unsave, persistence, empty state, corrupt/stale IDs, count and unavailable storage.");
