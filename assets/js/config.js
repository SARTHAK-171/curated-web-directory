// config.js — the settings you are most likely to edit. Everything else reads from here.

// Change the name here and it updates on every page.
export const SITE_NAME = "YOUR_SITE_NAME";
export const SITE_TAGLINE = "The Useful Internet, Organised.";
export const SITE_DESCRIPTION =
  "A curated collection of useful tools, AI platforms, learning resources and interesting corners of the internet.";

// One local-only key stores stable resource IDs (never complete resource objects).
export const SAVED_STORAGE_KEY = "orbit.savedResourceIds.v1";

// Main navigation. "page" must match <body data-page="..."> in each HTML file.
// "dropdown: true" gives the item the small arrow that opens the category list.
export const NAV_ITEMS = [
  { label: "Home", href: "index.html", page: "index" },
  { label: "Explore", href: "explore.html", page: "explore" },
  { label: "Categories", href: "index.html#categories", page: null, dropdown: true },
  { label: "Saved", href: "saved.html", page: "saved", showCount: true },
  { label: "About", href: "about.html", page: "about" },
];
