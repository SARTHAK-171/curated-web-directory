// explore.js — search, filtering and sorting for the Explore directory.

import { loadCategories, loadResources, DataValidationError } from "./data.js";
import { iconHTML } from "./icons.js";
import { filterResources } from "./directory.js";
import { initCustomSelects, refreshCustomSelects } from "./custom-select.js";

const elements = {
  search: document.getElementById("search-input"),
  category: document.getElementById("filter-category"),
  subcategory: document.getElementById("filter-subcategory"),
  pricing: document.getElementById("filter-pricing"),
  platform: document.getElementById("filter-platform"),
  openSource: document.getElementById("filter-open-source"),
  sort: document.getElementById("sort-order"),
  clear: document.getElementById("clear-filters"),
  count: document.getElementById("results-count"),
  results: document.getElementById("resource-results"),
};

let allResources = [];
let isReady = false;
let searchTimer = null;

const params = new URLSearchParams(window.location.search);
const state = {
  query: params.get("q") || "",
  category: params.get("category") || "",
  subcategory: params.get("subcategory") || "",
  pricing: (params.get("pricing") || "").toLocaleLowerCase(),
  openSource: params.get("openSource") === "true",
  platform: params.get("platform") || "",
  tag: params.get("tag") || "",
  sort: ["featured", "recent", "az", "za"].includes(params.get("sort"))
    ? params.get("sort")
    : "featured",
};

function addOptions(select, values, firstLabel) {
  const first = document.createElement("option");
  first.value = "";
  first.textContent = firstLabel;
  select.replaceChildren(first);
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
}

function populateFilters(categories, resources) {
  addOptions(elements.category, categories.map((item) => item.name), "All categories");
  const platforms = [...new Set(resources.flatMap((item) => item.platforms))].sort((a, b) =>
    a.localeCompare(b),
  );
  addOptions(elements.platform, platforms, "Any platform");

  elements.category.value = categories.some((item) => item.name === state.category)
    ? state.category
    : "";
  if (state.category && !elements.category.value) state.category = "";
  elements.pricing.value = ["free", "freemium", "paid"].includes(state.pricing)
    ? state.pricing
    : "";
  if (!elements.pricing.value) state.pricing = "";
  elements.platform.value = platforms.includes(state.platform) ? state.platform : "";
  if (!elements.platform.value) state.platform = "";
  elements.openSource.checked = state.openSource;
  elements.sort.value = state.sort;
  elements.search.value = state.query;
  updateSubcategories(resources, true);
  refreshCustomSelects();
}

function updateSubcategories(resources, keepSelection = true) {
  const category = elements.category.value;
  const matching = resources.filter((resource) => !category || resource.category === category);
  const subcategories = [...new Set(matching.map((resource) => resource.subcategory))]
    .sort((a, b) => a.localeCompare(b));
  addOptions(elements.subcategory, subcategories, "All subcategories");

  if (keepSelection && subcategories.includes(state.subcategory)) {
    elements.subcategory.value = state.subcategory;
  } else {
    state.subcategory = "";
    elements.subcategory.value = "";
  }
  elements.subcategory.disabled = subcategories.length === 0;
  refreshCustomSelects();
}

function createTag(label, className = "") {
  const tag = document.createElement("span");
  tag.className = `directory-tag${className ? ` ${className}` : ""}`;
  tag.textContent = label;
  return tag;
}

function createResourceCard(resource) {
  const article = document.createElement("article");
  article.className = "directory-card";

  const top = document.createElement("div");
  top.className = "directory-card-top";

  const icon = document.createElement("span");
  icon.className = "directory-card-icon";
  icon.setAttribute("aria-hidden", "true");
  const safeIcon = resource.icon ? iconHTML(resource.icon) : "";
  if (safeIcon) {
    icon.innerHTML = safeIcon;
  } else {
    icon.textContent = resource.name.trim().charAt(0).toLocaleUpperCase();
  }
  top.append(icon);

  const heading = document.createElement("h3");
  heading.textContent = resource.name;

  const description = document.createElement("p");
  description.className = "directory-card-description";
  description.textContent = resource.description;

  const meta = document.createElement("div");
  meta.className = "directory-card-meta";
  meta.append(createTag(resource.pricing, "pricing"));
  meta.append(createTag(resource.category));
  if (resource.openSource) meta.append(createTag("Open source"));
  if (resource.freeTrial) meta.append(createTag("Free trial"));
  if (resource.platforms.length) meta.append(createTag(resource.platforms.slice(0, 2).join(" · ")));

  const link = document.createElement("a");
  link.className = "directory-card-link";
  link.href = resource.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.referrerPolicy = "no-referrer";
  const linkText = document.createElement("span");
  linkText.textContent = "Visit official website";
  const arrow = document.createElement("span");
  arrow.innerHTML = iconHTML("arrow-up-right");
  link.append(linkText, arrow);

  article.append(top, heading, description, meta, link);
  return article;
}

function showEmptyState(hasFilters) {
  const wrapper = document.createElement("div");
  wrapper.className = "directory-empty";
  const heading = document.createElement("strong");
  const message = document.createElement("p");
  if (hasFilters) {
    heading.textContent = "No resources match these filters";
    message.textContent = "Try a different search or clear some filters to broaden the results.";
  } else {
    heading.textContent = "The collection is being curated";
    message.textContent = "There are no published resources yet. We are keeping this directory empty rather than filling it with unreviewed links.";
  }
  wrapper.append(heading, message);

  if (hasFilters) {
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "btn btn-secondary btn-sm";
    clear.textContent = "Clear filters";
    clear.addEventListener("click", clearFilters);
    wrapper.append(clear);
  }
  elements.results.replaceChildren(wrapper);
}

function syncAddressBar() {
  const next = new URLSearchParams();
  if (state.query.trim()) next.set("q", state.query.trim());
  if (state.category) next.set("category", state.category);
  if (state.subcategory) next.set("subcategory", state.subcategory);
  if (state.pricing) next.set("pricing", state.pricing);
  if (state.openSource) next.set("openSource", "true");
  if (state.platform) next.set("platform", state.platform);
  if (state.tag) next.set("tag", state.tag);
  if (state.sort !== "featured") next.set("sort", state.sort);
  const queryString = next.toString();
  const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", nextUrl);
}

function hasActiveFilters() {
  return Boolean(
    state.query.trim() || state.category || state.subcategory || state.pricing ||
    state.openSource || state.platform || state.tag || state.sort !== "featured"
  );
}

function render() {
  if (!isReady) return;
  const filtered = filterResources(allResources, state);
  const count = filtered.length;
  elements.count.textContent = `${count} ${count === 1 ? "resource" : "resources"} found`;
  elements.results.setAttribute("aria-busy", "false");
  elements.clear.disabled = !hasActiveFilters();

  if (count === 0) {
    showEmptyState(allResources.length > 0 && hasActiveFilters());
  } else {
    elements.results.replaceChildren(...filtered.map(createResourceCard));
  }
  syncAddressBar();
}

function clearFilters() {
  state.query = "";
  state.category = "";
  state.subcategory = "";
  state.pricing = "";
  state.openSource = false;
  state.platform = "";
  state.tag = "";
  state.sort = "featured";

  elements.search.value = "";
  elements.search.dispatchEvent(new Event("input", { bubbles: true }));
  elements.category.value = "";
  elements.pricing.value = "";
  elements.platform.value = "";
  elements.openSource.checked = false;
  elements.sort.value = "featured";
  updateSubcategories(allResources, false);
  render();
  elements.search.focus();
}

function showLoadError(error) {
  elements.results.setAttribute("aria-busy", "false");
  elements.count.textContent = "Resources could not be loaded";
  const wrapper = document.createElement("div");
  wrapper.className = "directory-error";
  const heading = document.createElement("strong");
  heading.textContent = "We couldn’t load the directory";
  const message = document.createElement("p");
  message.textContent = error instanceof DataValidationError
    ? "The resource data has a validation problem. Check data/resources.json and correct the reported fields."
    : "The resource data file could not be reached. Check the local server and the data/resources.json path.";
  wrapper.append(heading, message);

  if (error instanceof DataValidationError && error.report?.errors?.length) {
    const details = document.createElement("ul");
    details.className = "directory-error-list";
    for (const issue of error.report.errors.slice(0, 5)) {
      const item = document.createElement("li");
      item.textContent = issue;
      details.append(item);
    }
    wrapper.append(details);
  }
  elements.results.replaceChildren(wrapper);
  console.error("Explore directory failed to load:", error);
}

function bindControls() {
  elements.search.addEventListener("input", () => {
    state.query = elements.search.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(render, 90);
  });

      const searchForm = document.querySelector(".explore-search");

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    clearTimeout(searchTimer);
    state.query = elements.search.value.trim();

    render();

    elements.results.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

    elements.search.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      render();

      elements.results.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });

  elements.category.addEventListener("change", () => {
    state.category = elements.category.value;
    updateSubcategories(allResources, false);
    render();
  });
  elements.subcategory.addEventListener("change", () => {
    state.subcategory = elements.subcategory.value;
    render();
  });
  elements.pricing.addEventListener("change", () => {
    state.pricing = elements.pricing.value;
    render();
  });
  elements.platform.addEventListener("change", () => {
    state.platform = elements.platform.value;
    render();
  });
  elements.openSource.addEventListener("change", () => {
    state.openSource = elements.openSource.checked;
    render();
  });
  elements.sort.addEventListener("change", () => {
    state.sort = elements.sort.value;
    render();
  });
  elements.clear.addEventListener("click", clearFilters);
}

async function initialise() {
  initCustomSelects([elements.category, elements.subcategory, elements.pricing, elements.platform, elements.sort]);
  bindControls();
  try {
    const [categories, resources] = await Promise.all([loadCategories(), loadResources()]);
    allResources = resources;
    populateFilters(categories, resources);
    isReady = true;
    render();

    // If the visitor arrived from Home with a search query,
    // scroll directly to the results after they have loaded.
    if (params.get("q")?.trim()) {
      requestAnimationFrame(() => {
        elements.results.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });
    }
  } catch (error) {
    showLoadError(error);
  }
}

initialise();
