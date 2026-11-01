// app.js — the entry point. Every page loads this one file, and it starts
// everything else (header, footer, icons, search, animations).

import { SITE_NAME, SITE_TAGLINE } from "./config.js";
import { buildHeader, buildFooter } from "./layout.js";
import { hydrateIcons } from "./icons.js";
import { initSearchBoxes } from "./search-box.js";
import { setupScrollReveal } from "./motion.js";


// Page title: "Explore · YOUR_SITE_NAME" (the home page uses the tagline instead)
function setPageTitle() {
  const pageTitle = document.body.dataset.title; // set on <body data-title="...">
  document.title = pageTitle
    ? `${pageTitle} · ${SITE_NAME}`
    : `${SITE_NAME} — ${SITE_TAGLINE}`;
}


// Header gets a thin border once the page is scrolled a little
function setupHeaderScrollState() {
  const header = document.getElementById("site-header");
  if (!header) return;

  function update() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  update();
  window.addEventListener("scroll", update, { passive: true });
}


// ---------------------------------------------------------------
// Start everything (module scripts run after the page has loaded)
// ---------------------------------------------------------------
setPageTitle();
buildHeader();
buildFooter();
hydrateIcons();          // fills in <span data-icon="..."> found in the page
initSearchBoxes();
setupHeaderScrollState();
setupScrollReveal();
