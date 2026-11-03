// explore.js — search, filtering and sorting for the Explore directory.

import { loadCategories, loadResources, ACCESS_TYPE_VALUES, DataValidationError } from "./data.js";
import { filterResources } from "./directory.js";
import { initCustomSelects, refreshCustomSelects } from "./custom-select.js";
import { createResourceCard } from "./resource-card.js";
import { initSavedControls } from "./saved-resources.js";

const elements = {
  search: document.getElementById("search-input"),
  category: document.getElementById("filter-category"),
  subcategory: document.getElementById("filter-subcategory"),
  pricing: document.getElementById("filter-pricing"),
  accessType: document.getElementById("filter-access-type"),
  platform: document.getElementById("filter-platform"),
  openSource: document.getElementById("filter-open-source"),
  sort: document.getElementById("sort-order"),
  clear: document.getElementById("clear-filters"),
  count: document.getElementById("results-count"),
  results: document.getElementById("resource-results"),
};

const ACCESS_TYPE_LABELS = {
  browser: "Works in browser",
  download: "Download required",
  both: "Browser + download",
};

let allResources = [];
let categoryNames = {};
let isReady = false;
let searchTimer = null;

const params = new URLSearchParams(window.location.search);
const state = {
  query: params.get("q") || "",
  category: params.get("category") || "",
  subcategory: params.get("subcategory") || "",
  pricing: (params.get("pricing") || "").toLocaleLowerCase(),
  accessType: (params.get("accessType") || "").toLocaleLowerCase(),
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
  for (const item of values) {
    const option = document.createElement("option");
    option.value = typeof item === "string" ? item : item.value;
    option.textContent = typeof item === "string" ? item : item.label;
    select.append(option);
  }
}

function populateFilters(categories, resources) {
  addOptions(elements.category, categories.map((item) => ({ value: item.id, label: item.name })), "All categories");
  const platforms = [...new Set(resources.flatMap((item) => item.platforms))].sort((a, b) => a.localeCompare(b));
  addOptions(elements.platform, platforms, "Any platform");
  addOptions(elements.accessType, ACCESS_TYPE_VALUES.map((value) => ({ value, label: ACCESS_TYPE_LABELS[value] })), "Any access type");

  // Accept older category-name links, then keep the stable ID in the URL.
  const requestedCategory = categories.find((item) => item.id === state.category || item.name === state.category);
  state.category = requestedCategory?.id || "";
  elements.category.value = state.category;

  elements.pricing.value = ["free", "freemium", "paid"].includes(state.pricing) ? state.pricing : "";
  if (!elements.pricing.value) state.pricing = "";
  elements.accessType.value = ACCESS_TYPE_VALUES.includes(state.accessType) ? state.accessType : "";
  if (!elements.accessType.value) state.accessType = "";
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
  const subcategories = [...new Set(matching.map((resource) => resource.subcategory))].sort((a, b) => a.localeCompare(b));
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

function syncAddressBar() {
  const next = new URLSearchParams();
  if (state.query.trim()) next.set("q", state.query.trim());
  if (state.category) next.set("category", state.category);
  if (state.subcategory) next.set("subcategory", state.subcategory);
  if (state.pricing) next.set("pricing", state.pricing);
  if (state.accessType) next.set("accessType", state.accessType);
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
    state.accessType || state.openSource || state.platform || state.tag || state.sort !== "featured"
  );
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

function render() {
  if (!isReady) return;
  const filtered = filterResources(allResources, { ...state, categoryNames });
  elements.count.textContent = `${filtered.length} ${filtered.length === 1 ? "resource" : "resources"} found`;
  elements.results.setAttribute("aria-busy", "false");
  elements.clear.disabled = !hasActiveFilters();
  if (filtered.length === 0) showEmptyState(allResources.length > 0 && hasActiveFilters());
  else elements.results.replaceChildren(...filtered.map((resource) => createResourceCard(resource, categoryNames)));
  syncAddressBar();
}

function clearFilters() {
  state.query = "";
  state.category = "";
  state.subcategory = "";
  state.pricing = "";
  state.accessType = "";
  state.openSource = false;
  state.platform = "";
  state.tag = "";
  state.sort = "featured";
  elements.search.value = "";
  elements.search.dispatchEvent(new Event("input", { bubbles: true }));
  elements.category.value = "";
  elements.subcategory.value = "";
  elements.pricing.value = "";
  elements.accessType.value = "";
  elements.platform.value = "";
  elements.openSource.checked = false;
  elements.sort.value = "featured";
  updateSubcategories(allResources, false);
  refreshCustomSelects();
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
    ? "The resource data has a validation problem. Check the data files and correct the reported fields."
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
    elements.results.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  elements.search.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    clearTimeout(searchTimer);
    state.query = elements.search.value.trim();
    render();
    elements.results.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  elements.category.addEventListener("change", () => {
    state.category = elements.category.value;
    updateSubcategories(allResources, false);
    render();
  });
  elements.subcategory.addEventListener("change", () => { state.subcategory = elements.subcategory.value; render(); });
  elements.pricing.addEventListener("change", () => { state.pricing = elements.pricing.value; render(); });
  elements.accessType.addEventListener("change", () => { state.accessType = elements.accessType.value; render(); });
  elements.platform.addEventListener("change", () => { state.platform = elements.platform.value; render(); });
  elements.openSource.addEventListener("change", () => { state.openSource = elements.openSource.checked; render(); });
  elements.sort.addEventListener("change", () => { state.sort = elements.sort.value; render(); });
  elements.clear.addEventListener("click", clearFilters);
}

async function initialise() {
  initCustomSelects([
    elements.category,
    elements.subcategory,
    elements.pricing,
    elements.accessType,
    elements.platform,
    elements.sort,
  ]);
  bindControls();
  try {
    const [categories, resources] = await Promise.all([loadCategories(), loadResources()]);
    allResources = resources;
    categoryNames = Object.fromEntries(categories.map((category) => [category.id, category.name]));
    initSavedControls(resources);
    populateFilters(categories, resources);
    isReady = true;
    render();
    if (params.get("q")?.trim()) {
      requestAnimationFrame(() => elements.results.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  } catch (error) {
    showLoadError(error);
  }
}

initialise();
