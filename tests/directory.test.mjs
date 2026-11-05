// Run with: node --experimental-default-type=module tests/directory.test.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { filterResources, sortResources } from "../assets/js/directory.js";

const resources = [
  {
    id: "alpha-ai", name: "Alpha AI", description: "AI code assistant",
    fullDescription: "Generate code and explain errors.", category: "ai", subcategory: "Coding",
    tags: ["AI tools"], keywords: ["assistant"], features: ["autocomplete"],
    platforms: ["Web", "Windows"], pricing: "freemium", accessType: "both",
    openSource: false, freeTrial: true, featured: true, dateAdded: "2026-10-01",
  },
  {
    id: "beta-learn", name: "Beta", description: "Learn JavaScript",
    fullDescription: "Web lessons for beginners.", category: "study-learning", subcategory: "Programming",
    tags: ["Courses"], keywords: ["javascript"], features: ["lessons"],
    platforms: ["Web"], pricing: "free", accessType: "browser",
    openSource: true, freeTrial: false, featured: false, dateAdded: "2026-10-20",
  },
  {
    id: "gamma-local", name: "Gamma", description: "Local AI model",
    fullDescription: "Run models locally.", category: "ai", subcategory: "Models",
    tags: ["AI tools"], keywords: ["local"], features: ["offline"],
    platforms: ["Windows", "Linux"], pricing: "paid", accessType: "download",
    openSource: true, freeTrial: false, featured: false, dateAdded: null,
  },
];

const defaults = {
  query: "", category: "", subcategory: "", pricing: "", accessType: "",
  openSource: false, platform: "", tag: "", sort: "featured",
};

assert.deepEqual(filterResources(resources, { ...defaults, query: "AI code" }).map((item) => item.id), ["alpha-ai"]);
assert.deepEqual(filterResources(resources, { ...defaults, query: "javascript lessons" }).map((item) => item.id), ["beta-learn"]);
assert.deepEqual(filterResources(resources, { ...defaults, query: "FREE TRIAL" }).map((item) => item.id), ["alpha-ai"]);
assert.deepEqual(filterResources(resources, { ...defaults, query: "study learning", categoryNames: { "study-learning": "Study & Learning" } }).map((item) => item.id), ["beta-learn"]);
assert.equal(filterResources(resources, { ...defaults, category: "ai" }).length, 2);
assert.equal(filterResources(resources, { ...defaults, subcategory: "Programming" }).length, 1);
assert.equal(filterResources(resources, { ...defaults, pricing: "free" }).length, 1);
assert.deepEqual(
  filterResources(resources, { ...defaults, accessType: "browser" }).map((item) => item.id),
  ["alpha-ai", "beta-learn"],
  "Browser filter must include browser-only and both-access resources.",
);
assert.deepEqual(
  filterResources(resources, { ...defaults, accessType: "download" }).map((item) => item.id),
  ["alpha-ai", "gamma-local"],
  "Download filter must include download-only and both-access resources.",
);
assert.deepEqual(
  filterResources(resources, { ...defaults, accessType: "browser", category: "ai" }).map((item) => item.id),
  ["alpha-ai"],
  "Access filtering must continue composing with category filtering.",
);
assert.deepEqual(
  filterResources(resources, { ...defaults, accessType: "download", openSource: true }).map((item) => item.id),
  ["gamma-local"],
  "Access filtering must continue composing with other filters.",
);
assert.equal(filterResources(resources, { ...defaults, openSource: true }).length, 2);
assert.equal(filterResources(resources, { ...defaults, platform: "Linux" }).length, 1);
assert.equal(filterResources(resources, { ...defaults, tag: "AI tools" }).length, 2);
assert.equal(filterResources(resources, { ...defaults, query: "open source" }).length, 2);
assert.deepEqual(filterResources(resources, { ...defaults, savedIds: ["beta-learn", "gamma-local"] }).map((item) => item.id), ["beta-learn", "gamma-local"]);
assert.deepEqual(filterResources(resources, { ...defaults, savedIds: ["beta-learn"], query: "AI" }), []);

assert.deepEqual(sortResources(resources, "featured").map((item) => item.id), ["alpha-ai", "beta-learn", "gamma-local"]);
assert.deepEqual(sortResources(resources, "recent").map((item) => item.id), ["beta-learn", "alpha-ai", "gamma-local"]);
assert.deepEqual(sortResources(resources, "az").map((item) => item.name), ["Alpha AI", "Beta", "Gamma"]);
assert.deepEqual(sortResources(resources, "za").map((item) => item.name), ["Gamma", "Beta", "Alpha AI"]);
assert.deepEqual(filterResources([], defaults), []);

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const productionResources = JSON.parse(await readFile(resolve(projectRoot, "data/resources.json"), "utf8"));
const browserResults = new Set(filterResources(productionResources, { ...defaults, accessType: "browser" }).map((item) => item.id));
const downloadResults = new Set(filterResources(productionResources, { ...defaults, accessType: "download" }).map((item) => item.id));
for (const resource of productionResources) {
  if (resource.accessType === "both") {
    assert.ok(browserResults.has(resource.id), `${resource.id} must appear in the browser filter.`);
    assert.ok(downloadResults.has(resource.id), `${resource.id} must appear in the download filter.`);
  } else if (resource.accessType === "browser") {
    assert.ok(browserResults.has(resource.id), `${resource.id} must appear in the browser filter.`);
    assert.ok(!downloadResults.has(resource.id), `${resource.id} must not appear in the download filter.`);
  } else if (resource.accessType === "download") {
    assert.ok(downloadResults.has(resource.id), `${resource.id} must appear in the download filter.`);
    assert.ok(!browserResults.has(resource.id), `${resource.id} must not appear in the browser filter.`);
  }
}

console.log("PASS: Explore search, category/pricing/access/platform filters, saved filtering, sorting and production access-type behaviour.");
