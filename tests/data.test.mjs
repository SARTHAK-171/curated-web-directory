// Run with: node --experimental-default-type=module tests/data.test.mjs
import assert from "node:assert/strict";
import {
  APPROVED_CATEGORIES,
  PLATFORM_VALUES,
  PRICING_VALUES,
  validateResources,
} from "../assets/js/data.js";
import { filterResources } from "../assets/js/directory.js";
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
const productionReport = validateResources(productionResources);
assert.equal(productionReport.valid, true, productionReport.errors.join("\n"));
assert.ok(productionResources.length >= 30, "Stage 5 should publish a useful initial collection.");
assert.equal(new Set(productionResources.map((item) => item.id)).size, productionResources.length);
assert.equal(new Set(productionResources.map((item) => item.url)).size, productionResources.length, "Resources should not duplicate official URLs.");
assert.equal(productionResources.filter((item) => item.featured).length, 3, "The homepage should have three curated featured items.");
const defaults = { query: "", category: "", subcategory: "", pricing: "", openSource: false, platform: "", tag: "", sort: "featured" };
assert.ok(filterResources(productionResources, { ...defaults, category: "Developer", tag: "Web development" }).length > 0, "Web development homepage shortcut should return resources.");
assert.ok(filterResources(productionResources, { ...defaults, tag: "Creative" }).length > 0, "Creative homepage shortcut should return resources.");
assert.ok(filterResources(productionResources, { ...defaults, category: "Cybersecurity", tag: "Labs" }).length > 0, "Cybersecurity labs homepage shortcut should return resources.");
assert.ok(filterResources(productionResources, { ...defaults, pricing: "free" }).length > 0, "Free resources homepage shortcut should return resources.");
assert.deepEqual(
  new Set(productionResources.map((item) => item.category)),
  new Set(APPROVED_CATEGORIES),
  "Every approved category should have at least one resource.",
);
for (const resource of productionResources) {
  assert.ok(resource.url.startsWith("https://"), `${resource.id} should use HTTPS.`);
  assert.ok(resource.description.length <= 180, `${resource.id} card description should stay concise.`);
  assert.ok(resource.lastVerified, `${resource.id} should record its verification date.`);
}

console.log(`PASS: Resource schema, validation, approved categories and ${productionResources.length} production resources.`);
