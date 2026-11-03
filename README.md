# Curated Web Directory

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

Stages 1–6 are implemented. The collection contains 35 starter resources across five categories. Stage 6 adds persistent local saves, category IDs sourced from `data/categories.json`, access-type metadata and filtering, and an optional image/logo foundation.

## Important notes

- Saved resources are stored in the browser's localStorage on the current device/profile. They do not sync between devices.
- Run the site through a local web server (such as VS Code Live Server); the pages fetch JSON files and are not designed to run from `file://`.
- Follow `data/README.md` to add or maintain categories and resources.
- Follow `tests/README.md` to run the automated checks.
