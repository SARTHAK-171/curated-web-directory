# ORBIT — Curated Web Directory

A personal, curated directory of useful websites, tools, learning resources and interesting corners of the internet.

## Project goals

- Organise resources into categories maintained in JSON.
- Search, filter and sort the collection.
- Show clear descriptions, pricing and access information.
- Save resources locally in the current browser.
- Stay responsive, accessible and easy for a beginner to maintain.
- Host as a static website through GitHub Pages.

## Technology

HTML, CSS, vanilla JavaScript modules and JSON. There is no backend, database, account system, framework or external API.

## Current status

Stages 1–7 and Stage 9 are implemented; Stage 8 was intentionally skipped. The collection contains 35 starter resources across five categories. Stage 6 added persistent local saves, category IDs sourced from `data/categories.json`, access-type metadata and filtering, and an optional image/logo foundation. Stage 7 adds shareable resource detail pages, related-resource discovery and detail-page save/share actions. Stage 9 completes the About page, adds a mobile filter disclosure to Explore, and finalises shared ORBIT branding while preserving the existing Featured, Recently Added and saved-resource integrations.

## Important notes

- Saved resources are stored in the browser's localStorage on the current device/profile. They do not sync between devices.
- Run the site through a local web server (such as VS Code Live Server); the pages fetch JSON files and are not designed to run from `file://`.
- Follow `data/README.md` to add or maintain categories and resources.
- Follow `tests/README.md` to run the automated checks.

## Stage 7 — Resource detail pages

- Every resource has one reusable detail page: `resource.html?id=resource-id`. The ID is the stable `id` value in `data/resources.json`.
- To add a resource, add a valid object to `data/resources.json` with a unique ID and the required fields listed in `data/README.md`. Optional image metadata can be left as `null` or omitted.
- The detail page hides optional sections when their arrays or values are empty. It does not make up missing facts.
- Related resources are selected in a repeatable way using category, subcategory, tags and keywords. No external recommendation service is used.
- Resource images use the existing HTTPS image metadata and fall back to the resource icon or first letter if the image is unavailable.
- Save and unsave actions use the same `orbit.savedResourceIds.v1` browser storage key as the Saved page. Saved items stay on that browser/device.
- To test Stage 7, run all commands in `tests/README.md`, then open `resource.html?id=github` (or another real ID from `resources.json`) through Live Server. Try an invalid ID, copy link, save/unsave and related links.
