# Maintaining the directory data

The two JSON files in this folder are the source of truth for the directory:

- `categories.json` controls the category names, links, icons, colours and order.
- `resources.json` contains the resources shown on the website.

The website reads these files when a page opens. You do not need to edit JavaScript just to add a category or a resource.

## Category fields

Each category object needs these fields:

| Field | What it means |
|---|---|
| `id` | A permanent, unique key such as `study-learning`. Use lowercase letters and hyphens only. |
| `name` | The name visitors see, such as `Study & Learning`. |
| `description` | A short explanation shown on category cards and in the menu. |
| `icon` | An icon name already supported by `assets/js/icons.js`. |
| `color` | A six-digit hex colour such as `#b8ff6a`. |
| `displayOrder` | A unique positive whole number. Smaller numbers appear first. |

### Add a category

1. Open `data/categories.json`.
2. Copy one category object, including its braces and commas.
3. Give it a new unique `id`, name, description, icon, colour and display order.
4. Add at least one resource in `resources.json` that uses the new category ID in its `category` field.
5. Run the data tests. A category can appear with a zero count, but a useful category should contain at least one resource.

Example:

```json
{
  "id": "design-tools",
  "name": "Design Tools",
  "description": "Tools for creating and editing visual work.",
  "icon": "palette",
  "color": "#e7a7ff",
  "displayOrder": 6
}
```

The category cards, navigation menu and Explore category filter are generated from this file. Resource counts are calculated from the resources that use each category ID.

### Edit or remove a category

You can safely change a category's `name`, `description`, `icon`, `color` or `displayOrder`. The ID should normally stay the same. If you change an ID, update the `category` field on every resource that uses the old ID and update any hand-written homepage shortcut link. The category ID is the connection between the two JSON files.

Before removing a category, move each resource that uses its ID to another category or remove that resource. Then remove the category object. The data tests will report a broken category reference if a resource still points to an ID that no longer exists.

## Resource fields

`resources.json` must contain a JSON array. Each item is one resource.

| Field | Required | What it means |
|---|---:|---|
| `id` | Yes | Unique, stable key such as `my-new-tool`. Do not change it after people may have saved the resource. |
| `name` | Yes | Resource name shown on cards. |
| `description` | Yes | Short card description. Keep it concise. |
| `fullDescription` | Yes | Longer explanation for future detail views. |
| `category` | Yes | An existing category ID from `categories.json`, not its display name. |
| `subcategory` | Yes | A narrower grouping within the category. |
| `tags` | Yes | Array of useful labels. |
| `keywords` | Yes | Extra words that should help search find the resource. |
| `pricing` | Yes | `free`, `freemium` or `paid`. |
| `accessType` | Yes | `browser`, `download` or `both` (explained below). |
| `freeTrial` | Yes | `true` or `false`; separate from whether a free tier exists. |
| `openSource` | Yes | `true` or `false`; free-to-use does not automatically mean open source. |
| `platforms` | Yes | Array using `Web`, `Windows`, `macOS`, `Linux`, `Android` or `iOS`. This describes platform support, not access type. |
| `url` | Yes | Official resource URL, using `https://` where possible. |
| `icon` | No | Icon name already supported by `assets/js/icons.js`; a letter is used if the icon is missing. |
| `image` | No | `null` or an object with an HTTPS `src` and meaningful `alt` text. Use a small official image when available. |
| `featured` | Yes | `true` or `false`; the homepage currently shows up to three. |
| `dateAdded` | Yes | Real date in `YYYY-MM-DD` format, or `null`. |
| `lastVerified` | Yes | Real date in `YYYY-MM-DD` format, or `null`. |
| `features` | Yes | Array of useful features. |
| `limitations` | Yes | Array of important limitations or caveats. |

### `accessType` values

- `browser`: the main experience works directly in a browser.
- `download`: using the main resource requires installing or running software outside the browser.
- `both`: the website provides meaningful browser functionality and the provider also offers a useful downloadable/installable app or tool.

Do not confuse access type with `platforms`. For example, a browser service may work on Windows, macOS and phones but still have `accessType: "browser"`. Downloading a book, image or other content from a website does not make the website a download-required application.

### Pricing values

- `free`: the listed core resource can be used without paying.
- `freemium`: a usable free tier or free content exists alongside paid upgrades, limits or content.
- `paid`: the listed core resource requires payment.

Check the provider's own pricing page before changing this field. Do not assume that a free trial and a free plan are the same thing.

### Optional image example

```json
"image": {
  "src": "https://example.com/official-tool-logo.png",
  "alt": "Example Tool logo"
}
```

Use a direct image file from the official provider or a trustworthy project source. The website loads it only when needed, preserves the image area and falls back to the resource icon if it fails. Do not invent image URLs. Use `"image": null` until a source has been checked.

## Complete resource example

```json
{
  "id": "sample-editor",
  "name": "Sample Editor",
  "description": "A concise description of what the editor helps you do.",
  "fullDescription": "A longer explanation of the main workflow and who may find it useful.",
  "category": "developer",
  "subcategory": "Code editors",
  "tags": ["Coding", "Editor"],
  "keywords": ["write code", "programming"],
  "pricing": "freemium",
  "accessType": "both",
  "freeTrial": false,
  "openSource": false,
  "platforms": ["Web", "Windows", "macOS", "Linux"],
  "url": "https://example.com/",
  "icon": "code",
  "image": null,
  "featured": false,
  "dateAdded": "2026-11-03",
  "lastVerified": "2026-11-03",
  "features": ["Useful feature one", "Useful feature two"],
  "limitations": ["Important limitation or condition"]
}
```

### Add or edit a resource

1. Open `data/resources.json`.
2. Add a comma after the previous object, then paste a complete resource object.
3. Choose a category ID that already exists in `categories.json`.
4. Check the official website for the URL, pricing, access type, platforms and limitations.
5. Give the resource a unique ID. Use lowercase words separated by hyphens.
6. Run the tests before committing.

You can safely improve a name, description, category, tags, keywords, icon, image, features, limitations, URL or verification date. Keep the ID unchanged. Saved lists store IDs only, so changing an ID makes the old saved entry stale and it will be cleaned from the visitor's list the next time the page loads.

### Remove a resource

Delete its complete object from `resources.json`. Visitors who had saved it will have that unknown ID removed from local storage the next time a page loads. They will not see a broken card.

## Saved resources and privacy

Saved resources are stored in one browser `localStorage` key as an array of resource IDs. Full resource data is never copied into storage. Saving is local to the current browser profile and device; it does not sync between a phone and a laptop. Clearing browser storage can remove the saved list.

## Validate your changes

Run these commands from the project root:

```bash
node --experimental-default-type=module tests/data.test.mjs
node --experimental-default-type=module tests/directory.test.mjs
node --experimental-default-type=module tests/saved.test.mjs
node --experimental-default-type=module tests/integration.test.mjs
```

Also start the project with a local web server (for example, VS Code Live Server). Do not open the HTML file directly with `file://`; the pages load JSON files using `fetch()`.
