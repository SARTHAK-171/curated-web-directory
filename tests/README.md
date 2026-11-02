# Project tests

These files are development checks only. They are not loaded by the website and do not add resources to `data/resources.json`.

Run from the project root with Node.js:

```bash
node --experimental-default-type=module tests/data.test.mjs
node --experimental-default-type=module tests/directory.test.mjs
```

- `data.test.mjs` checks the approved categories, resource schema validation, duplicate IDs, invalid values, date handling, and the production resource collection, including category coverage and unique IDs.
- `directory.test.mjs` checks search, filters, empty results, and sorting.

The sample resources inside the test files are fixtures used to verify the code. They are not published as website content.
