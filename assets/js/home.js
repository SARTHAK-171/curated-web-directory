// home.js — extra code that only the homepage needs.
//
// It builds the six category cards from data/categories.json (the same file
// that feeds the header dropdown and footer), then loads resources.json to fill
// each card’s resource count. Category navigation still works if resources fail
// to load or fail validation.

import { categoryUrl } from "./layout.js";
import { loadCategories, loadResources } from "./data.js";
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

    try {
      const resources = await loadResources();
      for (const count of grid.querySelectorAll("[data-category-count]")) {
        const total = resources.filter(
          (resource) => resource.category === count.dataset.categoryCount,
        ).length;
        count.textContent = `${total} ${total === 1 ? "resource" : "resources"}`;
        count.hidden = false;
      }
    } catch (error) {
      // Category navigation remains usable if the resource file is unavailable
      // or invalid. Keep the count slots hidden rather than displaying guesses.
      console.error("Resource data is unavailable; category counts were not shown.", error);
    }
  } catch (error) {
    console.warn("Could not show the category cards:", error);
    showMessage("The categories could not be loaded.");
  }
}

renderCategories();
