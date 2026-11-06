import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const pages = ["index.html", "explore.html", "saved.html", "about.html", "resource.html"];
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  assert.match(html, /orbit\.theme\.v1/);
  assert.match(html, /assets\/css\/theme\.css/);
  assert.match(html, /<header id="site-header"/);
}
const layout = fs.readFileSync(path.join(root, "assets/js/layout.js"), "utf8");
assert.match(layout, /data-theme-toggle/);
const app = fs.readFileSync(path.join(root, "assets/js/app.js"), "utf8");
assert.match(app, /initTheme\(\)/);
const theme = fs.readFileSync(path.join(root, "assets/js/theme.js"), "utf8");
assert.match(theme, /localStorage\.setItem/);
const css = fs.readFileSync(path.join(root, "assets/css/theme.css"), "utf8");
for (const colour of ["#f4f5f7", "#ffffff", "#eceef2", "#e0e3ea", "#dde0e7", "#c1c6d1", "#12141a", "#444a58", "#62687a", "#6f35ee", "#14708f", "#cf2459", "#b35f00", "#23813f"]) {
  assert.ok(css.toLowerCase().includes(colour), `Missing palette colour ${colour}`);
}
assert.match(css, /:root\[data-theme="light"\] \.hero-visual \.orbit-art \{ display: block; \}/);
assert.match(css, /:root\[data-theme="light"\] \.hero-visual \.mock \{ display: none; \}/);
console.log("PASS: theme preference, shared toggle, palette tokens, and light-only orbit integration.");
