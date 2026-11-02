// Run with: node --experimental-default-type=module tests/data.test.mjs
import assert from "node:assert/strict";
import {
  APPROVED_CATEGORIES,
  PLATFORM_VALUES,
  PRICING_VALUES,
  validateResources,
} from "../assets/js/data.js";
import { readFile } from "node:fs/promises";

const validResource = {
  id: "sample-tool",
  name: "Sample Tool",
  description: "A short description.",
  fullDescription: "A longer description for the details view.",
  category: "Developer",
  subcategory: "Code editors",
  tags: ["Coding"],
  keywords: ["editor"],
  pricing: "freemium",
  freeTrial: true,
  openSource: false,
  platforms: ["Web", "Windows"],
  url: "https://example.com",
  icon: "code",
  featured: false,
  dateAdded: "2026-10-01",
  lastVerified: "2026-10-02",
  features: ["Syntax highlighting"],
  limitations: ["Some features require payment"],
};

assert.deepEqual(APPROVED_CATEGORIES, [
  "AI",
  "Developer",
  "Cybersecurity",
  "Study & Learning",
  "Fun & Entertainment",
  "Relaxation",
]);
assert.deepEqual(PRICING_VALUES, ["free", "freemium", "paid"]);
assert.deepEqual(PLATFORM_VALUES, ["Web", "Windows", "macOS", "Linux", "Android", "iOS"]);

const empty = validateResources([]);
assert.equal(empty.valid, true);
assert.deepEqual(empty.resources, []);

const wrongRoot = validateResources({ resource: validResource });
assert.equal(wrongRoot.valid, false);
assert.equal(wrongRoot.resources, null);

const missingField = validateResources([{
  ...validResource,
  limitations: undefined,
}]);
assert.equal(missingField.valid, false);
assert.ok(missingField.errors.some((issue) => issue.includes("limitations")));

const valid = validateResources([validResource]);
assert.equal(valid.valid, true);
assert.deepEqual(valid.resources, [validResource]);

const nullableDates = validateResources([{
  ...validResource,
  dateAdded: null,
  lastVerified: null,
}]);
assert.equal(nullableDates.valid, true);

const duplicateIds = validateResources([
  validResource,
  { ...validResource, name: "Duplicate" },
]);
assert.equal(duplicateIds.valid, false);
assert.ok(duplicateIds.errors.some((issue) => issue.includes("duplicate identifier")));

const invalidFields = validateResources([{
  ...validResource,
  category: "Creative",
  pricing: "free forever",
  platforms: ["Web", "Xbox"],
  url: "javascript:alert(1)",
  dateAdded: "2026-02-30",
  openSource: "false",
  tags: ["", 42],
}]);
assert.equal(invalidFields.valid, false);
for (const expected of ["category", "pricing", "platforms", "url", "dateAdded", "openSource", "tags"]) {
  assert.ok(invalidFields.errors.some((issue) => issue.includes(expected)), `Expected validation error for ${expected}`);
}

const warningOnly = validateResources([{
  ...validResource,
  dateAdded: "2026-10-10",
  lastVerified: "2026-10-01",
}]);
assert.equal(warningOnly.valid, true);
assert.equal(warningOnly.warnings.length, 1);

const categories = JSON.parse(await readFile(new URL("../data/categories.json", import.meta.url), "utf8"));
assert.deepEqual(categories.map((item) => item.name), APPROVED_CATEGORIES);

const productionResources = JSON.parse(
  await readFile(new URL("../data/resources.json", import.meta.url), "utf8"),
);
assert.deepEqual(productionResources, [], "Production resources must stay empty until reviewed entries are added.");

console.log("PASS: Resource schema, validation, approved categories and empty production data.");
