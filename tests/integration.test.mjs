// Run with: node --experimental-default-type=module tests/integration.test.mjs
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const htmlFiles = ["index.html", "explore.html", "saved.html", "about.html", "resource.html"];

for (const file of htmlFiles) {
  const html = await readFile(resolve(root, file), "utf8");
  const references = [
    ...html.matchAll(/(?:href|src)="([^"#]+)"/g),
  ].map((match) => match[1]);
  for (const reference of references) {
    if (/^(?:https?:|data:|mailto:|tel:|javascript:)/i.test(reference)) continue;
    const localPath = reference.split(/[?#]/, 1)[0];
    if (!localPath) continue;
    await assert.doesNotReject(
      access(resolve(root, localPath)),
      `${file} references missing local file: ${reference}`,
    );
  }
}

const savedHTML = await readFile(resolve(root, "saved.html"), "utf8");
assert.match(savedHTML, /assets\/js\/saved-page\.js/);
assert.match(savedHTML, /id="saved-search"/);
assert.match(savedHTML, /id="saved-categories"/);
assert.match(savedHTML, /id="saved-results"/);

const exploreHTML = await readFile(resolve(root, "explore.html"), "utf8");
assert.match(exploreHTML, /id="filter-access-type"/);

const config = await readFile(resolve(root, "assets/js/config.js"), "utf8");
assert.match(config, /orbit\.savedResourceIds\.v1/);
const layout = await readFile(resolve(root, "assets/js/layout.js"), "utf8");
assert.match(layout, /syncSavedCountWithResources/);
assert.match(layout, /savedStore\.count\(validIds\)/, "Navigation counts must ignore deleted resource IDs on all pages.");

// Local font and image references inside stylesheets must resolve as well.
for (const stylesheet of ["assets/css/style.css", "assets/css/components.css", "assets/css/home.css", "assets/css/explore.css", "assets/css/saved.css", "assets/css/detail.css"]) {
  const css = await readFile(resolve(root, stylesheet), "utf8");
  for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    const reference = match[1].trim();
    if (/^(?:https?:|data:|#)/i.test(reference)) continue;
    await assert.doesNotReject(
      access(resolve(root, dirname(stylesheet), reference)),
      `${stylesheet} references missing local asset: ${reference}`,
    );
  }
}

const projectFiles = [
  "index.html", "explore.html", "saved.html", "about.html", "resource.html",
  "assets/js/data.js", "assets/js/saved-resources.js", "assets/js/resource-card.js",
  "assets/js/saved-page.js", "assets/js/explore.js", "assets/js/home.js", "assets/js/resource-detail.js",
];
for (const file of projectFiles) {
  const source = await readFile(resolve(root, file), "utf8");
  assert.doesNotMatch(source, /category=relax[^&"']*/i, `${file} contains an obsolete category link`);
}

const categories = JSON.parse(await readFile(resolve(root, "data/categories.json"), "utf8"));
const categoryIds = new Set(categories.map((category) => category.id));
const resources = JSON.parse(await readFile(resolve(root, "data/resources.json"), "utf8"));
assert.ok(resources.every((resource) => categoryIds.has(resource.category)), "All resources must reference a live category ID.");

const detailHTML = await readFile(resolve(root, "resource.html"), "utf8");
assert.match(detailHTML, /id="detail-title"/);
assert.match(detailHTML, /assets\/js\/resource-detail\.js/);
const cardSource = await readFile(resolve(root, "assets/js/resource-card.js"), "utf8");
assert.match(cardSource, /resource\.html\?id=/);
assert.match(cardSource, /noopener noreferrer/);
const homeSource = await readFile(resolve(root, "assets/js/home.js"), "utf8");
assert.match(homeSource, /resource\.html\?id=/, "Homepage resource entries must link to their detail page.");
console.log("PASS: HTML local paths, detail page wiring, Saved page wiring, access filter and project integration references.");
