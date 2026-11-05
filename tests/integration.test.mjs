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
assert.ok(exploreHTML.includes('<option value="browser">Works in browser</option>'));
assert.ok(exploreHTML.includes('<option value="download">Download</option>'));
assert.doesNotMatch(exploreHTML, /<option value="both">/, "The combined access type must not be a separate filter option.");
assert.match(exploreHTML, /<details class="filter-disclosure" id="filter-disclosure" open>/);
assert.match(exploreHTML, /<summary>[\s\S]*?Filters[\s\S]*?<\/summary>/);
const exploreScript = await readFile(resolve(root, "assets/js/explore.js"), "utf8");
assert.match(exploreScript, /value: "browser", label: "Works in browser"/);
assert.match(exploreScript, /value: "download", label: "Download"/);
assert.doesNotMatch(exploreScript, /value: "both"|label: "Browser \\+ download"/);
assert.match(exploreScript, /ACCESS_TYPE_FILTER_VALUES\.includes\(state\.accessType\)/);
const directoryScript = await readFile(resolve(root, "assets/js/directory.js"), "utf8");
assert.match(directoryScript, /filters\.accessType === "browser".*\["browser", "both"\]/);
assert.match(directoryScript, /filters\.accessType === "download".*\["download", "both"\]/);
assert.match(exploreScript, /matchMedia\("\(max-width: 600px\)"\)/);
assert.match(exploreScript, /disclosure\.open = !event\.matches/);

const aboutHTML = await readFile(resolve(root, "about.html"), "utf8");
assert.doesNotMatch(aboutHTML, /Placeholder page|YOUR_SITE_NAME/);
for (const sectionId of ["about-heading", "approach-heading", "about-categories-heading", "about-cta-heading"]) {
  assert.match(aboutHTML, new RegExp(`id="${sectionId}"`));
}
for (const categoryPath of ["ai", "developer", "cybersecurity", "study-learning", "fun-entertainment"]) {
  assert.ok(aboutHTML.includes(`explore.html?category=${categoryPath}`), `About page should link to the ${categoryPath} category.`);
}
assert.match(aboutHTML, /Study &amp; Learning/);
assert.match(aboutHTML, /Fun &amp; Entertainment/);

const configBrand = await readFile(resolve(root, "assets/js/config.js"), "utf8");
assert.match(configBrand, /SITE_NAME = "ORBIT"/);

const config = await readFile(resolve(root, "assets/js/config.js"), "utf8");
assert.match(config, /orbit\.savedResourceIds\.v1/);
const layout = await readFile(resolve(root, "assets/js/layout.js"), "utf8");
assert.match(layout, /syncSavedCountWithResources/);
assert.match(layout, /savedStore\.count\(validIds\)/, "Navigation counts must ignore deleted resource IDs on all pages.");

// Local font and image references inside stylesheets must resolve as well.
for (const stylesheet of ["assets/css/style.css", "assets/css/components.css", "assets/css/home.css", "assets/css/explore.css", "assets/css/saved.css", "assets/css/detail.css", "assets/css/about.css"]) {
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

for (const file of htmlFiles) {
  const html = await readFile(resolve(root, file), "utf8");
  assert.doesNotMatch(html, /YOUR_SITE_NAME/, `${file} should not retain the template brand placeholder`);
}

const detailHTML = await readFile(resolve(root, "resource.html"), "utf8");
assert.match(detailHTML, /id="detail-title"/);
assert.match(detailHTML, /assets\/js\/resource-detail\.js/);
const cardSource = await readFile(resolve(root, "assets/js/resource-card.js"), "utf8");
assert.match(cardSource, /resource\.html\?id=/);
assert.match(cardSource, /noopener noreferrer/);
const homeHTML = await readFile(resolve(root, "index.html"), "utf8");
assert.match(homeHTML, /id="featured-grid"/);
assert.match(homeHTML, /id="recent-list"/);
const homeSource = await readFile(resolve(root, "assets/js/home.js"), "utf8");
assert.match(homeSource, /resource\.html\?id=/, "Homepage resource entries must link to their detail page.");
assert.match(homeSource, /resource\.featured/, "Featured items must come from the existing resource flag.");
assert.match(homeSource, /resource\.dateAdded/, "Recently Added items must use existing date metadata.");

const savedStoreSource = await readFile(resolve(root, "assets/js/saved-resources.js"), "utf8");
assert.match(savedStoreSource, /window\.addEventListener\("storage"/);
console.log("PASS: HTML local paths, detail page wiring, Saved page wiring, access filter and project integration references.");
