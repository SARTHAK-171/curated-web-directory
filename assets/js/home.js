// home.js — extra code that only the homepage needs.
//
// For now it does one job: it builds the six category cards from
// data/categories.json (the same file that feeds the header dropdown and the
// footer), so the category names, icons and descriptions live in ONE place.
//
// It does NOT load resources. Stage 3 will do that, and will fill in the
// resource counts using the empty "count" slot that each card already has.

import { loadCategories, categoryUrl } from "./layout.js";
import { iconHTML } from "./icons.js";
import { setupScrollReveal } from "./motion.js";

const grid = document.getElementById("category-grid");

function buildCategoryCard(category) {
  const item = document.createElement("li");

  const link = document.createElement("a");
  link.className = "category-card";
  link.href = categoryUrl(category);

  // Top row: icon tile on the left, arrow on the right
  const top = document.createElement("span");
  top.className = "category-card-top";

  const tile = document.createElement("span");
  tile.className = "icon-tile";
  tile.innerHTML = iconHTML(category.icon); // icon names come from a fixed list in icons.js

  const arrow = document.createElement("span");
  arrow.className = "arrow";
  arrow.innerHTML = iconHTML("arrow-up-right");

  top.append(tile, arrow);

  // Name and description (textContent keeps data safe: it is never read as HTML)
  const name = document.createElement("h3");
  name.textContent = category.name;

  const description = document.createElement("p");
  description.textContent = category.description || "";

  // An empty slot for the resource count. It stays hidden until Stage 3 fills it in.
  const count = document.createElement("p");
  count.className = "mono-label category-count";
  count.dataset.categoryCount = category.name;
  count.hidden = true;

  link.append(top, name, description, count);
  item.append(link);
  return item;
}

function showMessage(text) {
  const item = document.createElement("li");
  item.className = "grid-message";
  const message = document.createElement("p");
  message.textContent = text + " ";
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

    grid.replaceChildren(...categories.map(buildCategoryCard));
    setupScrollReveal(); // the new cards are not on the page yet when app.js runs, so set them up now
  } catch (error) {
    console.warn("Could not show the category cards:", error);
    showMessage("The categories could not be loaded.");
  }
}

renderCategories();
