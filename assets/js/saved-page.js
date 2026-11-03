// saved-page.js — search and category filtering for the locally saved collection.

import { loadCategories, loadResources, DataValidationError } from "./data.js";
import { filterResources } from "./directory.js";
import { createResourceCard } from "./resource-card.js";
import { initSavedControls } from "./saved-resources.js";

const elements = {
  search: document.getElementById("saved-search"),
  categories: document.getElementById("saved-categories"),
  count: document.getElementById("saved-results-count"),
  results: document.getElementById("saved-results"),
};

let allResources = [];
let categoryNames = {};
let selectedCategory = "";
let currentSavedIds = [];

function buildCategoryFilters(categories) {
  const buttons = [
    { id: "", name: "All categories" },
    ...categories.map((category) => ({ id: category.id, name: category.name })),
  ];
  elements.categories.replaceChildren(...buttons.map((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip chip-button";
    button.dataset.category = category.id;
    button.textContent = category.name;
    button.setAttribute("aria-pressed", String(category.id === selectedCategory));
    return button;
  }));
}

function showMessage(title, description, showExploreLink = false) {
  const wrapper = document.createElement("div");
  wrapper.className = "directory-empty saved-empty";
  const heading = document.createElement("strong");
  heading.textContent = title;
  const message = document.createElement("p");
  message.textContent = description;
  wrapper.append(heading, message);
  if (showExploreLink) {
    const link = document.createElement("a");
    link.className = "btn btn-primary btn-sm";
    link.href = "explore.html";
    link.textContent = "Explore resources";
    wrapper.append(link);
  }
  elements.results.replaceChildren(wrapper);
}

function render() {
  const saved = new Set(currentSavedIds);
  const savedResources = allResources.filter((resource) => saved.has(resource.id));
  const filtered = filterResources(savedResources, {
    query: elements.search.value,
    category: selectedCategory,
    categoryNames,
    sort: "featured",
  });

  elements.count.textContent = `${filtered.length} of ${savedResources.length} saved ${savedResources.length === 1 ? "resource" : "resources"}`;
  elements.results.setAttribute("aria-busy", "false");

  if (savedResources.length === 0) {
    showMessage("Your saved list is empty", "Use the heart button on any resource card to keep it here for later.", true);
    return;
  }
  if (filtered.length === 0) {
    showMessage("No saved resources match", "Try another search or category. You can also clear the search field.");
    return;
  }

  elements.results.replaceChildren(...filtered.map((resource) => createResourceCard(resource, categoryNames)));
}

function showLoadError(error) {
  elements.count.textContent = "Saved resources could not be loaded";
  const message = error instanceof DataValidationError
    ? "The resource or category data has a validation problem. Check the data files and fix the reported fields."
    : "The directory data could not be reached. Run the website through a local web server and check the data file paths.";
  showMessage("We couldn’t load your saved list", message, false);
  console.error("Saved page failed to load:", error);
}

async function initialise() {
  try {
    const [categories, resources] = await Promise.all([loadCategories(), loadResources()]);
    allResources = resources;
    categoryNames = Object.fromEntries(categories.map((category) => [category.id, category.name]));
    buildCategoryFilters(categories);
    initSavedControls(resources, (ids) => {
      currentSavedIds = ids;
      render();
    });

    elements.search.addEventListener("input", render);
    elements.categories.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      selectedCategory = button.dataset.category;
      for (const item of elements.categories.querySelectorAll("[data-category]")) {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-pressed", String(item === button));
      }
      render();
    });
  } catch (error) {
    showLoadError(error);
  }
}

initialise();
