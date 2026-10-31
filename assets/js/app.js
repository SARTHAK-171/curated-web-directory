// app.js — the entry point. Every page loads this one file, and it starts
// everything else (header, footer, icons, search, animations).

import { SITE_NAME, SITE_TAGLINE } from "./config.js";
import { buildHeader, buildFooter } from "./layout.js";
import { hydrateIcons } from "./icons.js";
import { initSearchBoxes } from "./search-box.js";


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


// Scroll reveal: things below the fold fade in and rise a little, once, as the
// visitor scrolls to them.
//   <section data-reveal>               -> the element itself is revealed
//   <ul data-reveal-stagger>            -> each child is revealed, one after another
// Anything already on screen is left alone, and nothing is hidden at all when
// the visitor has asked their device for reduced motion.
function setupScrollReveal() {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const targets = [];
  for (const element of document.querySelectorAll("[data-reveal]")) {
    targets.push({ element, order: 0 });
  }
  for (const group of document.querySelectorAll("[data-reveal-stagger]")) {
    [...group.children].forEach((element, index) => {
      targets.push({ element, order: Math.min(index, 5) }); // at most 5 steps of delay
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.remove("reveal-hidden");
        entry.target.classList.add("reveal-in");
        observer.unobserve(entry.target); // only animate once
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
  );

  for (const { element, order } of targets) {
    if (element.getBoundingClientRect().top < window.innerHeight) continue; // already visible
    element.style.setProperty("--i", order);
    element.classList.add("reveal-hidden");
    observer.observe(element);
  }
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
