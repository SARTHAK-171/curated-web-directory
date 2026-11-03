# Project tests

These checks run during development only. They are not loaded by the website and do not add content to the public directory.

Run each command from the project root with Node.js:

```bash
node --experimental-default-type=module tests/data.test.mjs
node --experimental-default-type=module tests/directory.test.mjs
node --experimental-default-type=module tests/saved.test.mjs
node --experimental-default-type=module tests/integration.test.mjs
node --experimental-default-type=module tests/detail.test.mjs
```

- `data.test.mjs` checks category IDs and fields, resource schema, unique IDs/URLs, category references, pricing, access types, image metadata, dates and the 35-resource production collection.
- `directory.test.mjs` checks search, category/subcategory, pricing, access-type, platform, open-source and tag filters, saved-only filtering, empty results and all sort modes.
- `saved.test.mjs` checks saving, removing, persistence across store instances, empty state data, corrupt JSON, duplicate/stale IDs, accurate counts and unavailable browser storage.
- `integration.test.mjs` checks local HTML file references, detail and Saved page wiring, access filter wiring and obsolete category links.
- `detail.test.mjs` checks stable-ID lookup, related-resource selection, safe external URLs and clipboard success/failure handling.

These are automated static/data tests, not a replacement for opening the site in a browser. For a full manual check, run the project through a local HTTP server (for example, VS Code Live Server) and follow the Stage 6 checklist supplied with the update.
