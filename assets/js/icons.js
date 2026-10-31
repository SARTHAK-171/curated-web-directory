// icons.js — the site's icon set, in one small file.
//
// Icons are from Tabler Icons v3.50.0 (https://tabler.io/icons), MIT licence,
// Copyright (c) 2020-2026 Pawel Kuna. The licence text is in THIRD-PARTY-NOTICES.md.
//
// HOW TO USE
//   In JavaScript:   element.innerHTML = iconHTML("search");
//   In HTML:         <span data-icon="search"></span>     (hydrateIcons() fills it in)
//
// HOW TO ADD A NEW ICON
//   1. Find it on https://tabler.io/icons and open the "outline" SVG.
//   2. Copy everything BETWEEN the <svg ...> and </svg> tags
//      (leave out the first <path stroke="none" d="M0 0h24v24H0z" fill="none"/>).
//   3. Add a line below:  "icon-name": '<path d="..." />',
//
// Every icon inherits the text colour (currentColor) and is sized in CSS (.icon).

const ICONS = {
  "search": '<path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /> <path d="M21 21l-6 -6" />',
  "x": '<path d="M18 6l-12 12" /> <path d="M6 6l12 12" />',
  "arrow-right": '<path d="M5 12l14 0" /> <path d="M13 18l6 -6" /> <path d="M13 6l6 6" />',
  "arrow-up-right": '<path d="M17 7l-10 10" /> <path d="M8 7l9 0l0 9" />',
  "chevron-down": '<path d="M6 9l6 6l6 -6" />',
  "arrows-shuffle": '<path d="M18 4l3 3l-3 3" /> <path d="M18 20l3 -3l-3 -3" /> <path d="M3 7h3a5 5 0 0 1 5 5a5 5 0 0 0 5 5h5" /> <path d="M21 7h-5a4.978 4.978 0 0 0 -3 1m-4 8a4.984 4.984 0 0 1 -3 1h-3" />',
  "heart": '<path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />',
  "heart-filled": '<path fill="currentColor" stroke="none" d="M6.979 3.074a6 6 0 0 1 4.988 1.425l.037 .033l.034 -.03a6 6 0 0 1 4.733 -1.44l.246 .036a6 6 0 0 1 3.364 10.008l-.18 .185l-.048 .041l-7.45 7.379a1 1 0 0 1 -1.313 .082l-.094 -.082l-7.493 -7.422a6 6 0 0 1 3.176 -10.215z" />',
  "sparkles": '<path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2m-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6" />',
  "code": '<path d="M7 8l-4 4l4 4" /> <path d="M17 8l4 4l-4 4" /> <path d="M14 4l-4 16" />',
  "shield-lock": '<path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /> <path d="M11 11a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /> <path d="M12 12l0 2.5" />',
  "school": '<path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" /> <path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />',
  "device-gamepad-2": '<path d="M12 5h3.5a5 5 0 0 1 0 10h-5.5l-4.015 4.227a2.3 2.3 0 0 1 -3.923 -2.035l1.634 -8.173a5 5 0 0 1 4.904 -4.019h3.4" /> <path d="M14 15l4.07 4.284a2.3 2.3 0 0 0 3.925 -2.023l-1.6 -8.232" /> <path d="M8 9v2" /> <path d="M7 10h2" /> <path d="M14 10h2" />',
  "leaf": '<path d="M5 21c.5 -4.5 2.5 -8 7 -10" /> <path d="M9 18c6.218 0 10.5 -3.288 11 -12v-2h-4.014c-9 0 -11.986 4 -12 9c0 1 0 3 2 5h3l.014 0" />',
  "adjustments-horizontal": '<path d="M12 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /> <path d="M4 6l8 0" /> <path d="M16 6l4 0" /> <path d="M6 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /> <path d="M4 12l2 0" /> <path d="M10 12l10 0" /> <path d="M15 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /> <path d="M4 18l11 0" /> <path d="M19 18l1 0" />',
  "external-link": '<path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /> <path d="M11 13l9 -9" /> <path d="M15 4h5v5" />',
  "check": '<path d="M5 12l5 5l10 -10" />',
};

// Returns the icon as an HTML string. The names are fixed in this file,
// so the output is safe to insert with innerHTML.
export function iconHTML(name, extraClass = "") {
  const body = ICONS[name];
  if (!body) {
    console.warn(`Unknown icon: "${name}"`);
    return "";
  }
  return `<svg class="icon ${extraClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

// Finds every <... data-icon="name"> inside "root" and puts the icon in it.
export function hydrateIcons(root = document) {
  for (const holder of root.querySelectorAll("[data-icon]")) {
    holder.innerHTML = iconHTML(holder.dataset.icon);
  }
}
