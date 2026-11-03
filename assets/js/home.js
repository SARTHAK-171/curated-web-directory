// home.js — homepage sections populated from the shared production data.
// Resource records live only in data/resources.json; this file only renders them.

import { categoryUrl } from "./layout.js";
import { loadCategories, loadResources } from "./data.js";
import { iconHTML } from "./icons.js";
import { setupScrollReveal } from "./motion.js";
import { createSaveButton, initSavedControls } from "./saved-resources.js";
import { ACCESS_TYPE_LABELS } from "./resource-card.js";

const grid = document.getElementById("category-grid");
const featuredGrid = document.getElementById("featured-grid");
const featuredNote = document.getElementById("featured-note");
const recentList = document.getElementById("recent-list");
const recentNote = document.getElementById("recent-note");
let categoryNames = {};

function buildCategoryCard(category) {
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.className = "category-card";
  link.href = categoryUrl(category);

  const top = document.createElement("span");
  top.className = "category-card-top";
  const tile = document.createElement("span");
  tile.className = "icon-tile";
  tile.style.setProperty("--category-accent", category.color);
  tile.innerHTML = iconHTML(category.icon);
  const arrow = document.createElement("span");
  arrow.className = "arrow";
  arrow.innerHTML = iconHTML("arrow-up-right");
  top.append(tile, arrow);

  const name = document.createElement("h3");
  name.textContent = category.name;
  const description = document.createElement("p");
  description.textContent = category.description || "";
  const count = document.createElement("p");
  count.className = "mono-label category-count";
  count.dataset.categoryCount = category.id;
  count.hidden = true;

  link.append(top, name, description, count);
  item.append(link);
  return item;
}

function makeMonogram(name, className = "monogram") {
  const mark = document.createElement("span");
  mark.className = className;
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = name.trim().charAt(0).toLocaleUpperCase();
  return mark;
}

function buildFeaturedCard(resource) {
  const item = document.createElement("li");
  const article = document.createElement("article");
  article.className = "resource-card";

  const top = document.createElement("div");
  top.className = "resource-card-top";
  const mark = makeMonogram(resource.name);
  if (resource.image?.src && resource.image?.alt) {
    const image = document.createElement("img");
    image.className = "resource-card-image";
    image.src = resource.image.src;
    image.alt = resource.image.alt;
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => {
      image.remove();
      mark.setAttribute("aria-hidden", "true");
    }, { once: true });
    const fallback = document.createElement("span");
    fallback.textContent = resource.name.trim().charAt(0).toLocaleUpperCase();
    fallback.setAttribute("aria-hidden", "true");
    mark.replaceChildren(fallback, image);
    mark.removeAttribute("aria-hidden");
  }
  top.append(mark, createSaveButton(resource));

  const body = document.createElement("div");
  body.className = "resource-card-body";
  const heading = document.createElement("h3");
  heading.textContent = resource.name;
  const description = document.createElement("p");
  description.textContent = resource.description;
  body.append(heading, description);

  const footer = document.createElement("div");
  footer.className = "resource-card-footer";
  const category = document.createElement("span");
  category.className = "mono-label";
  category.textContent = categoryNames[resource.category] || resource.category;
  const accessType = document.createElement("span");
  accessType.className = "mono-label resource-access-type";
  accessType.textContent = ACCESS_TYPE_LABELS[resource.accessType];
  const visit = document.createElement("a");
  visit.className = "visit";
  visit.href = resource.url;
  visit.target = "_blank";
  visit.rel = "noopener noreferrer";
  visit.referrerPolicy = "no-referrer";
  visit.append(document.createTextNode("Visit official website "));
  const arrow = document.createElement("span");
  arrow.innerHTML = iconHTML("arrow-up-right");
  visit.append(arrow);
  const details = document.createElement("a");
  details.className = "resource-details-link";
  details.href = `resource.html?id=${encodeURIComponent(resource.id)}`;
  details.textContent = "View details";
  footer.append(category, accessType, details, visit);

  article.append(top, body, footer);
  item.append(article);
  return item;
}

function formatAddedDate(value) {
  if (!value) return "Date not set";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function buildRecentRow(resource) {
  const item = document.createElement("li");
  item.className = "recent-row";
  item.append(makeMonogram(resource.name));

  const details = document.createElement("span");
  details.className = "recent-lines";
  const name = document.createElement("a");
  name.className = "recent-resource-link";
  name.href = resource.url;
  name.target = "_blank";
  name.rel = "noopener noreferrer";
  name.referrerPolicy = "no-referrer";
  name.textContent = resource.name;
  const detailsLink = document.createElement("a");
  detailsLink.className = "recent-details-link";
  detailsLink.href = `resource.html?id=${encodeURIComponent(resource.id)}`;
  detailsLink.textContent = "View details";
  const description = document.createElement("span");
  description.textContent = resource.description;
  details.append(name, detailsLink, description);

  const date = document.createElement("span");
  date.className = "recent-date";
  const label = document.createElement("span");
  label.className = "mono-label";
  label.textContent = "Added";
  const value = document.createElement("time");
  value.className = "mono-label";
  if (resource.dateAdded) value.dateTime = resource.dateAdded;
  value.textContent = formatAddedDate(resource.dateAdded);
  date.append(label, value);

  item.append(details, date);
  return item;
}

function showMessage(text) {
  const item = document.createElement("li");
  item.className = "grid-message";
  const message = document.createElement("p");
  message.textContent = `${text} `;
  const link = document.createElement("a");
  link.href = "explore.html";
  link.textContent = "Go to Explore";
  message.append(link);
  item.append(message);
  grid.replaceChildren(item);
}

async function renderCategories() {
  if (!grid) return;
  try {
    const categories = await loadCategories();
    if (categories.length === 0) throw new Error("No categories found");
    categoryNames = Object.fromEntries(categories.map((category) => [category.id, category.name]));
    grid.replaceChildren(...categories.map(buildCategoryCard));

    const resources = await loadResources();
    initSavedControls(resources);
    for (const count of grid.querySelectorAll("[data-category-count]")) {
      const total = resources.filter(
        (resource) => resource.category === count.dataset.categoryCount,
      ).length;
      count.textContent = `${total} ${total === 1 ? "resource" : "resources"}`;
      count.hidden = false;
    }

    if (featuredGrid) {
      const featured = resources.filter((resource) => resource.featured).slice(0, 3);
      featuredGrid.replaceChildren(...featured.map(buildFeaturedCard));
      if (featuredNote) featuredNote.hidden = featured.length > 0;
      featuredGrid.removeAttribute("aria-busy");
    }

    if (recentList) {
      const recent = [...resources]
        .filter((resource) => resource.dateAdded)
        .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded) || a.name.localeCompare(b.name))
        .slice(0, 4);
      recentList.replaceChildren(...recent.map(buildRecentRow));
      if (recentNote) recentNote.hidden = recent.length > 0;
    }

    setupScrollReveal();
  } catch (error) {
    console.error("Homepage data could not be loaded:", error);
    if (grid && !grid.children.length) showMessage("The categories could not be loaded.");
    if (featuredNote) {
      featuredNote.hidden = false;
      featuredNote.textContent = "Featured resources are temporarily unavailable.";
    }
    if (recentNote) {
      recentNote.hidden = false;
      recentNote.textContent = "Recently added resources are temporarily unavailable.";
    }
  }
}

renderCategories();
