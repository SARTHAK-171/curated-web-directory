// Run with: node --experimental-default-type=module tests/detail.test.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getResourceById, getRelatedResources, safeExternalURL, copyText } from "../assets/js/resource-detail.js";

const resources = JSON.parse(await readFile(new URL("../data/resources.json", import.meta.url), "utf8"));
const current = resources[0];
assert.equal(getResourceById(resources, current.id), current);
assert.equal(getResourceById(resources, ""), null);
assert.equal(getResourceById(resources, "not-a-real-resource"), null);
assert.equal(getResourceById(resources, null), null);
const related = getRelatedResources(current, resources, 4);
assert.ok(related.length <= 4);
assert.ok(related.every((item) => item.id !== current.id));
assert.equal(new Set(related.map((item) => item.id)).size, related.length);
const duplicatedRelated = getRelatedResources(current, [...resources, { ...resources[1] }], 10);
assert.equal(new Set(duplicatedRelated.map((item) => item.id)).size, duplicatedRelated.length, "Duplicate IDs must never create duplicate recommendations.");
assert.ok(getRelatedResources({ id: "isolated", category: "none", subcategory: "none", tags: [], keywords: [] }, resources).length === 0);
assert.equal(safeExternalURL("https://example.com/path"), "https://example.com/path");
assert.equal(safeExternalURL("javascript:alert(1)"), "");
assert.equal(safeExternalURL("data:text/html,hi"), "");
assert.equal(safeExternalURL("not a url"), "");
let copied = "";
assert.equal(await copyText("https://example.com", { writeText: async (value) => { copied = value; } }, null), true);
assert.equal(copied, "https://example.com");
assert.equal(await copyText("x", null, null), false);
let fallbackCopied = false;
const fakeDocument = {
  body: { append(field) { field.select = () => {}; field.remove = () => {}; } },
  createElement() { return { style: {}, setAttribute() {}, select() {}, remove() {} }; },
  execCommand(command) { fallbackCopied = command === "copy"; return fallbackCopied; },
};
assert.equal(await copyText("fallback", null, fakeDocument), true);
assert.equal(fallbackCopied, true);

console.log("PASS: detail ID lookup, related-resource rules, safe external URLs and clipboard handling.");
