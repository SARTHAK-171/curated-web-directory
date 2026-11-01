// layout.js — builds the header (with the Categories dropdown and the mobile
// menu) and the footer. They are written once here, so every page shares them.

import {
  SITE_NAME,
  SITE_DESCRIPTION,
  NAV_ITEMS,
  SAVED_STORAGE_KEY,
} from "./config.js";
import { iconHTML } from "./icons.js";


// ---------------------------------------------------------------
// Categories
// The names live in data/categories.json (one place to edit).
// fetch() downloads the file. We do it only once and share the result with
// the dropdown and the footer. (This moves to data.js in Stage 3.)
// ---------------------------------------------------------------
let categoriesPromise = null;

export function loadCategories() {
  if (!categoriesPromise) {
    categoriesPromise = fetch("data/categories.json")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((list) => {
        if (!Array.isArray(list)) throw new Error("categories.json must be a list");
        // Skip any broken entries instead of crashing
        return list.filter((category) => category && typeof category.name === "string");
      });
  }
  return categoriesPromise;
}

export function categoryUrl(category) {
  // encodeURIComponent makes names like "Study & Learning" safe inside a URL
  return `explore.html?category=${encodeURIComponent(category.name)}`;
}


// ---------------------------------------------------------------
// Saved count
// localStorage can hold anything (or be blocked), so read it carefully.
// ---------------------------------------------------------------
function getSavedCount() {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    if (!raw) return 0;
    const saved = JSON.parse(raw);
    return Array.isArray(saved) ? saved.length : 0;
  } catch (error) {
    return 0;
  }
}


// ---------------------------------------------------------------
// Header
// The fixed parts are an HTML template. Anything that comes from settings
// or data is added with textContent, which is always safe.
// ---------------------------------------------------------------
export function buildHeader() {
  const header = document.getElementById("site-header");
  if (!header) return;

  header.classList.add("site-header");
  header.innerHTML = `
    <div class="container header-inner">
      <a class="brand" href="index.html">
        <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <circle cx="16" cy="16" r="5" fill="currentColor"></circle>
          <ellipse cx="16" cy="16" rx="13" ry="6" transform="rotate(-25 16 16)"
                   fill="none" stroke="currentColor" stroke-width="2"></ellipse>
        </svg>
        <span class="brand-name"></span>
      </a>

      <button class="menu-toggle" type="button" aria-expanded="false"
              aria-controls="site-nav" aria-label="Menu">
        <span class="menu-toggle-bars" aria-hidden="true"></span>
      </button>

      <nav class="site-nav" id="site-nav" aria-label="Main">
        <ul class="nav-list"></ul>
        <button class="btn btn-secondary btn-sm" type="button" id="surprise-button"
                disabled title="Coming soon">
          ${iconHTML("arrows-shuffle")}Surprise Me
        </button>
      </nav>
    </div>
  `;

  header.querySelector(".brand-name").textContent = SITE_NAME;

  // One <li> per entry in NAV_ITEMS
  const list = header.querySelector(".nav-list");
  for (const item of NAV_ITEMS) {
    list.append(buildNavItem(item));
  }

  setupHeaderBehaviour(header);
}

function buildNavItem(item) {
  const currentPage = document.body.dataset.page;
  const li = document.createElement("li");
  li.className = "nav-item";

  const link = document.createElement("a");
  link.className = "nav-link";
  link.href = item.href;
  link.textContent = item.label;

  if (item.page && item.page === currentPage) {
    link.setAttribute("aria-current", "page");
  }

  if (item.showCount) {
    const count = getSavedCount();
    const badge = document.createElement("span");
    badge.className = "count-badge";
    badge.id = "saved-count";
    badge.textContent = String(count);
    link.append(badge);
    link.setAttribute("aria-label", `Saved, ${count} resources`);
  }

  // Normal item: just the link
  if (!item.dropdown) {
    li.append(link);
    return li;
  }

  // Dropdown item: the link (still a real link to #categories) plus a small
  // arrow button that opens the list. Keeping them separate means the link
  // always works, even if the dropdown does not.
  li.classList.add("nav-item--dropdown");

  const split = document.createElement("div");
  split.className = "nav-split";

  const chevron = document.createElement("button");
  chevron.className = "nav-chevron";
  chevron.type = "button";
  chevron.setAttribute("aria-expanded", "false");
  chevron.setAttribute("aria-controls", "categories-menu");
  chevron.setAttribute("aria-label", "Categories menu");
  chevron.innerHTML = iconHTML("chevron-down");

  split.append(link, chevron);

  const panel = document.createElement("div");
  panel.className = "dropdown-panel";
  panel.id = "categories-menu";
  const dropdownList = document.createElement("ul");
  dropdownList.className = "dropdown-list";
  panel.append(dropdownList);

  li.append(split, panel);

  // Fill the list once the category data arrives
  loadCategories()
    .then((categories) => {
      for (const category of categories) {
        dropdownList.append(buildDropdownLink(category));
      }
    })
    .catch((error) => {
      console.warn("Could not load categories for the menu:", error);
      chevron.remove(); // the plain "Categories" link still works
      panel.remove();
    });

  return li;
}

function buildDropdownLink(category) {
  const li = document.createElement("li");
  const link = document.createElement("a");
  link.className = "dropdown-link";
  link.href = categoryUrl(category);

  const tile = document.createElement("span");
  tile.className = "icon-tile";
  tile.innerHTML = iconHTML(category.icon); // icon names come from a fixed list in icons.js

  const text = document.createElement("span");
  const name = document.createElement("strong");
  name.textContent = category.name;
  const description = document.createElement("small");
  description.textContent = category.description || "";
  text.append(name, description);

  link.append(tile, text);
  li.append(link);
  return li;
}


// ---------------------------------------------------------------
// Header behaviour: the mobile menu and the Categories dropdown.
// Both can be opened and closed with mouse, touch and keyboard.
// ---------------------------------------------------------------
function setupHeaderBehaviour(header) {
  const toggle = header.querySelector(".menu-toggle");
  const nav = header.querySelector(".site-nav");
  const dropdownItem = header.querySelector(".nav-item--dropdown");
  const chevron = dropdownItem.querySelector(".nav-chevron");
  const panel = dropdownItem.querySelector(".dropdown-panel");

  const isMenuOpen = () => nav.classList.contains("is-open");
  const isDropdownOpen = () => dropdownItem.classList.contains("is-open");

  function setMenuOpen(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (!open) setDropdownOpen(false); // closing the menu also folds the list
  }

  function setDropdownOpen(open, { focusFirst = false } = {}) {
    dropdownItem.classList.toggle("is-open", open);
    chevron.setAttribute("aria-expanded", String(open));
    if (open && focusFirst) {
      const firstLink = panel.querySelector("a");
      if (firstLink) firstLink.focus();
    }
  }

  // --- Mobile menu button ---
  toggle.addEventListener("click", () => setMenuOpen(!isMenuOpen()));

  // --- Dropdown arrow button ---
  chevron.addEventListener("click", () => setDropdownOpen(!isDropdownOpen()));

  // ArrowDown on the arrow button opens the list and jumps to the first item
  chevron.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setDropdownOpen(true, { focusFirst: true });
    }
  });

  // Arrow keys, Home and End move between the items in the list
  panel.addEventListener("keydown", (event) => {
    const links = [...panel.querySelectorAll("a")];
    const index = links.indexOf(document.activeElement);
    let target = null;

    if (event.key === "ArrowDown") target = links[(index + 1) % links.length];
    if (event.key === "ArrowUp") target = index <= 0 ? chevron : links[index - 1];
    if (event.key === "Home") target = links[0];
    if (event.key === "End") target = links[links.length - 1];

    if (target) {
      event.preventDefault();
      target.focus();
    }
  });

  // Choosing a link closes everything (needed for same-page links like #categories)
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenuOpen(false);
  });

  // Escape: close the dropdown first (and return focus to its button),
  // otherwise close the mobile menu (and return focus to its button)
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (isDropdownOpen()) {
      setDropdownOpen(false);
      chevron.focus();
    } else if (isMenuOpen()) {
      setMenuOpen(false);
      toggle.focus();
    }
  });

  // Clicking or tapping anywhere outside closes the open menu or dropdown
  document.addEventListener("click", (event) => {
    if (isDropdownOpen() && !dropdownItem.contains(event.target)) {
      setDropdownOpen(false);
    }
    if (isMenuOpen() && !header.contains(event.target)) {
      setMenuOpen(false);
    }
  });

  // Tabbing away from the dropdown closes it
  dropdownItem.addEventListener("focusout", (event) => {
    if (isDropdownOpen() && event.relatedTarget && !dropdownItem.contains(event.relatedTarget)) {
      setDropdownOpen(false);
    }
  });

  // If the window grows to desktop size, reset the mobile menu
  window.matchMedia("(min-width: 861px)").addEventListener("change", (event) => {
    if (event.matches) setMenuOpen(false);
  });
}


// ---------------------------------------------------------------
// Footer
// ---------------------------------------------------------------
export function buildFooter() {
  const footer = document.getElementById("site-footer");
  if (!footer) return;

  footer.classList.add("site-footer");
  footer.innerHTML = `
    <div class="container footer-grid">
      <div>
        <p class="footer-brand"></p>
        <p class="footer-text" id="footer-description"></p>
      </div>

      <nav aria-label="Categories">
        <h2 class="footer-heading">Categories</h2>
        <ul class="footer-list" id="footer-categories"></ul>
      </nav>

      <nav aria-label="Site">
        <h2 class="footer-heading">Site</h2>
        <ul class="footer-list">
          <li><a href="explore.html">Explore</a></li>
          <li><a href="saved.html">Saved</a></li>
          <li><a href="about.html">About</a></li>
        </ul>
      </nav>

      <div>
        <h2 class="footer-heading">Privacy</h2>
        <p class="footer-text">
          Saved resources are kept in your browser's localStorage on this
          device only. They are not synced between devices and can be lost if
          you clear your browser data. This site has no accounts and does not
          use analytics or tracking scripts.
        </p>
      </div>
    </div>

    <div class="container footer-bottom">
      <p id="footer-copyright"></p>
    </div>
  `;

  footer.querySelector(".footer-brand").textContent = SITE_NAME;
  footer.querySelector("#footer-description").textContent = SITE_DESCRIPTION;
  footer.querySelector("#footer-copyright").textContent =
    `© ${new Date().getFullYear()} ${SITE_NAME}. External websites have their own terms, privacy policies and pricing.`;

  const list = footer.querySelector("#footer-categories");
  loadCategories()
    .then((categories) => {
      for (const category of categories) {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = categoryUrl(category);
        link.textContent = category.name;
        li.append(link);
        list.append(li);
      }
    })
    .catch((error) => {
      console.warn("Could not load categories for the footer:", error);
      const li = document.createElement("li");
      li.className = "footer-text";
      li.textContent = "Categories could not be loaded.";
      list.append(li);
    });
}
