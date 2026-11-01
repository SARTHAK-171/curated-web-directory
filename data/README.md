# Resource data schema

`resources.json` is the directory's single source of truth. It must contain a JSON array. It is currently `[]` because no production resources have been curated for this stage.

Each array item must be an object with these fields:

| Field | Type | Required | Rule |
|---|---|---:|---|
| `id` | string | Yes | Unique, stable, non-empty identifier |
| `name` | string | Yes | Resource name |
| `description` | string | Yes | Short card description |
| `fullDescription` | string | Yes | Detailed description |
| `category` | string | Yes | One of the six approved categories |
| `subcategory` | string | Yes | Non-empty subcategory |
| `tags` | string array | Yes | Zero or more non-empty strings |
| `keywords` | string array | Yes | Zero or more non-empty strings |
| `pricing` | string | Yes | `free`, `freemium`, or `paid` |
| `freeTrial` | boolean | Yes | Whether a free trial is available |
| `openSource` | boolean | Yes | Open-source status, independent of pricing |
| `platforms` | string array | Yes | Values from the platform list below |
| `url` | string | Yes | Absolute HTTP or HTTPS URL |
| `icon` | string | No | Optional icon identifier; UI may use a letter fallback |
| `featured` | boolean | Yes | Whether it is selected for the featured area |
| `dateAdded` | string or null | Yes | Real calendar date in `YYYY-MM-DD` format, or `null` |
| `lastVerified` | string or null | Yes | Real calendar date in `YYYY-MM-DD` format, or `null` |
| `features` | string array | Yes | Zero or more feature descriptions |
| `limitations` | string array | Yes | Zero or more known limitations |

Approved categories (exact spelling):

- `AI`
- `Developer`
- `Cybersecurity`
- `Study & Learning`
- `Fun & Entertainment`
- `Relaxation`

Approved platforms (exact spelling): `Web`, `Windows`, `macOS`, `Linux`, `Android`, `iOS`.

Pricing, free-trial status and open-source status are separate properties. For example, an open-source project may be paid, free or freemium. Do not infer one property from another.

## Validation behaviour

`assets/js/data.js` exports `loadResources()`, `loadCategories()`, `validateResources()` and the approved-value constants.

- File/network/HTTP/JSON failures throw `DataLoadError` (`fatal: true`).
- Structurally valid JSON with invalid resource records throws `DataValidationError` (`fatal: false`) and includes a `report` with `errors` and `warnings`.
- Validation does not repair, rewrite, or silently discard resource records.
- Warnings are advisory; validation errors prevent the resource list from being returned.
- Both loaders cache successful requests for the current page. Failed requests can be retried.

Run the website through a local HTTP server (for example, VS Code Live Server). Fetching JSON is not reliable from a `file://` URL.

No example resource is included in the production JSON. Add only researched, verified resources.
