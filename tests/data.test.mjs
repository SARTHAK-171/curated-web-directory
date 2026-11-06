// Run with: node --experimental-default-type=module tests/data.test.mjs
import assert from "node:assert/strict";
import {
  ACCESS_TYPE_VALUES,
  PLATFORM_VALUES,
  PRICING_VALUES,
  validateCategories,
  validateResources,
} from "../assets/js/data.js";
import { filterResources } from "../assets/js/directory.js";
import { readFile } from "node:fs/promises";

const categories = JSON.parse(await readFile(new URL("../data/categories.json", import.meta.url), "utf8"));
const categoryIds = new Set(categories.map((category) => category.id));

const validResource = {
  id: "sample-tool",
  name: "Sample Tool",
  description: "A short description.",
  fullDescription: "A longer description for the details view.",
  category: "developer",
  subcategory: "Code editors",
  tags: ["Coding"],
  keywords: ["editor"],
  pricing: "freemium",
  accessType: "browser",
  freeTrial: true,
  openSource: false,
  platforms: ["Web", "Windows"],
  url: "https://example.com",
  icon: "code",
  image: null,
  featured: false,
  dateAdded: "2026-10-01",
  lastVerified: "2026-10-02",
  features: ["Syntax highlighting"],
  limitations: ["Some features require payment"],
};

assert.deepEqual(PRICING_VALUES, ["free", "freemium", "paid"]);
assert.deepEqual(ACCESS_TYPE_VALUES, ["browser", "download", "both"]);
assert.deepEqual(PLATFORM_VALUES, ["Web", "Windows", "macOS", "Linux", "Android", "iOS"]);

const validatedCategories = validateCategories(categories);
assert.equal(validatedCategories.length, 5);
assert.deepEqual(validatedCategories.map((item) => item.displayOrder), [1, 2, 3, 4, 5]);
assert.equal(new Set(categories.map((item) => item.id)).size, categories.length);
assert.equal(new Set(categories.map((item) => item.name)).size, categories.length);
assert.ok(categories.every((item) => item.id && item.name && item.description && item.icon && item.color));
assert.ok(categories.every((item) => !item.id.startsWith("relax")));

assert.throws(() => validateCategories([
  ...categories,
  { ...categories[0], id: categories[0].id, name: "Duplicate", displayOrder: 6 },
]), /validation error/);

const empty = validateResources([], categories);
assert.equal(empty.valid, true);
assert.deepEqual(empty.resources, []);

const wrongRoot = validateResources({ resource: validResource }, categories);
assert.equal(wrongRoot.valid, false);
assert.equal(wrongRoot.resources, null);

const missingField = validateResources([{
  ...validResource,
  limitations: undefined,
}], categories);
assert.equal(missingField.valid, false);
assert.ok(missingField.errors.some((issue) => issue.includes("limitations")));

const valid = validateResources([validResource], categories);
assert.equal(valid.valid, true);
assert.deepEqual(valid.resources, [validResource]);

const resourceWithImage = validateResources([{
  ...validResource,
  image: { src: "https://example.com/logo.png", alt: "Sample Tool logo" },
}], categories);
assert.equal(resourceWithImage.valid, true, "A valid optional HTTPS image and alt description should pass.");

const nullableDates = validateResources([{
  ...validResource,
  dateAdded: null,
  lastVerified: null,
}], categories);
assert.equal(nullableDates.valid, true);

const duplicateIds = validateResources([
  validResource,
  { ...validResource, name: "Duplicate" },
], categories);
assert.equal(duplicateIds.valid, false);
assert.ok(duplicateIds.errors.some((issue) => issue.includes("duplicate identifier")));

const invalidFields = validateResources([{
  ...validResource,
  category: "missing-category",
  pricing: "free forever",
  accessType: "online",
  platforms: ["Web", "Xbox"],
  url: "javascript:alert(1)",
  dateAdded: "2026-02-30",
  openSource: "false",
  tags: ["", 42],
  image: { src: "http://example.com/logo.png", alt: "" },
}], categories);
assert.equal(invalidFields.valid, false);
for (const expected of ["category", "pricing", "accessType", "platforms", "url", "dateAdded", "openSource", "tags", "image.src", "image.alt"]) {
  assert.ok(invalidFields.errors.some((issue) => issue.includes(expected)), `Expected validation error for ${expected}`);
}

const wrongAccessType = validateResources([{ ...validResource, accessType: undefined }], categories);
assert.equal(wrongAccessType.valid, false);
assert.ok(wrongAccessType.errors.some((issue) => issue.includes("accessType")));

const warningOnly = validateResources([{
  ...validResource,
  dateAdded: "2026-10-10",
  lastVerified: "2026-10-01",
}], categories);
assert.equal(warningOnly.valid, true);
assert.equal(warningOnly.warnings.length, 1);

const productionResources = JSON.parse(
  await readFile(new URL("../data/resources.json", import.meta.url), "utf8"),
);
const productionReport = validateResources(productionResources, categories);
assert.equal(productionReport.valid, true, productionReport.errors.join("\n"));
assert.equal(productionResources.length, 41, "All 35 existing resources plus six new entries should be retained.");
assert.equal(new Set(productionResources.map((item) => item.id)).size, productionResources.length);
assert.equal(new Set(productionResources.map((item) => item.url)).size, productionResources.length, "Resources should not duplicate official URLs.");
assert.ok(categories.some((item) => item.id === "web-tools-discovery" && item.name === "Web Tools & Discovery"), "The renamed category must exist.");
assert.ok(!categories.some((item) => item.id === "cybersecurity"), "The old category ID must be removed.");
for (const id of ["yopmail", "have-i-been-pwned", "fmhy", "jslinux", "grabify-awareness", "call-bomber-awareness", "hugging-face"]) assert.ok(productionResources.some((item) => item.id === id), `Expected curated resource ${id}.`);
assert.equal(productionResources.filter((item) => item.featured).length, 3, "The homepage should have three curated featured items.");
assert.ok(productionResources.every((item) => categoryIds.has(item.category)), "Every resource must reference a category ID.");
assert.ok(productionResources.every((item) => ACCESS_TYPE_VALUES.includes(item.accessType)), "Every resource needs a valid access type.");
assert.ok(productionResources.every((item) => item.image === null || (item.image?.src && item.image?.alt)), "Image metadata must be complete when used.");

const defaults = { query: "", category: "", subcategory: "", pricing: "", accessType: "", openSource: false, platform: "", tag: "", sort: "featured" };
assert.ok(filterResources(productionResources, { ...defaults, category: "developer", tag: "Web development" }).length > 0, "Web development homepage shortcut should return resources.");
assert.ok(filterResources(productionResources, { ...defaults, tag: "Creative" }).length > 0, "Creative homepage shortcut should return resources.");
assert.ok(filterResources(productionResources, { ...defaults, category: "web-tools-discovery" }).length > 0, "Web Tools & Discovery category shortcut should return resources.");
assert.ok(filterResources(productionResources, { ...defaults, pricing: "free" }).length > 0, "Free resources homepage shortcut should return resources.");
assert.ok(filterResources(productionResources, { ...defaults, accessType: "download" }).length > 0, "The access-type filter should return downloadable resources.");
assert.deepEqual(
  new Set(productionResources.map((item) => item.category)),
  categoryIds,
  "Every category should have at least one resource and every resource category should exist.",
);
for (const resource of productionResources) {
  assert.ok(resource.url.startsWith("https://"), `${resource.id} should use HTTPS.`);
  assert.ok(resource.description.length <= 180, `${resource.id} card description should stay concise.`);
  assert.ok(resource.lastVerified, `${resource.id} should record its verification date.`);
}

console.log(`PASS: Category schema, resource validation, access types and ${productionResources.length} production resources across ${categories.length} categories.`);
