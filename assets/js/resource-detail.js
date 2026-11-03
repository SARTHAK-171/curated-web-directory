// resource-detail.js — one data-driven detail page for every stable resource ID.
import { loadCategories, loadResources } from "./data.js";
import { createResourceCard } from "./resource-card.js";
import { initSavedControls, isResourceSaved } from "./saved-resources.js";
import { iconHTML } from "./icons.js";
import { SITE_NAME } from "./config.js";

const $ = (id) => typeof document === "undefined" ? null : document.getElementById(id);
const elements = {
  loading: $("detail-loading"), error: $("detail-error"), errorMessage: $("detail-error-message"),
  content: $("resource-detail-content"), category: $("detail-category"), subcategory: $("detail-subcategory"),
  logo: $("detail-logo"), title: $("detail-title"), description: $("detail-description"), tags: $("detail-tags"),
  visit: $("detail-visit"), save: $("detail-save"), copy: $("detail-copy"), feedback: $("detail-feedback"),
  fullDescription: $("detail-full-description"), featuresSection: $("detail-features-section"), features: $("detail-features"),
  limitationsSection: $("detail-limitations-section"), limitations: $("detail-limitations"), facts: $("detail-facts-list"),
  platformsSection: $("detail-platforms-section"), platforms: $("detail-platforms"), keywordsSection: $("detail-keywords-section"),
  keywords: $("detail-keywords"), relatedSection: $("detail-related-section"), related: $("detail-related-grid"),
};
let currentResource = null;
let allResources = [];
let categoryNames = {};

export function getResourceById(resources, id) {
  if (typeof id !== "string" || !id.trim()) return null;
  return resources.find((resource) => resource.id === id) || null;
}

export function getRelatedResources(resource, resources, limit = 4) {
  if (!resource || !Array.isArray(resources)) return [];
  const ownTags = new Set([...(resource.tags || []), ...(resource.keywords || [])].map(normalise));
  const seenIds = new Set([resource.id]);
  const ranked = [];
  resources.forEach((item, index) => {
    if (!item || typeof item.id !== "string" || !item.id || seenIds.has(item.id)) return;
    seenIds.add(item.id);
    let score = 0;
    if (item.category === resource.category) score += 5;
    if (item.subcategory && item.subcategory === resource.subcategory) score += 3;
    for (const tag of [...(item.tags || []), ...(item.keywords || [])]) {
      if (ownTags.has(normalise(tag))) score += 2;
    }
    if (score > 0) ranked.push({ item, score, index });
  });
  return ranked.sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, Math.max(0, limit)).map(({ item }) => item);
}

export function safeExternalURL(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && Boolean(url.hostname) ? url.href : "";
  } catch {
    return "";
  }
}

export async function copyText(text, clipboard = globalThis.navigator?.clipboard, documentRef = globalThis.document) {
  if (clipboard && typeof clipboard.writeText === "function") {
    try { await clipboard.writeText(text); return true; } catch { /* Try the legacy fallback. */ }
  }
  if (!documentRef?.body || typeof documentRef.execCommand !== "function") return false;
  const field = documentRef.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  documentRef.body.append(field);
  field.select();
  let copied = false;
  try { copied = documentRef.execCommand("copy"); } catch { copied = false; }
  field.remove();
  return copied;
}

function normalise(value) { return String(value || "").trim().toLocaleLowerCase(); }
function setText(element, value) { element.textContent = value == null ? "" : String(value); }
function showOptionalSection(section, visible) { section.hidden = !visible; }
function makePill(value) {
  const pill = document.createElement("span");
  pill.className = "detail-pill";
  pill.textContent = value;
  return pill;
}
function renderList(list, values) {
  list.replaceChildren(...values.map((value) => {
    const item = document.createElement("li");
    item.textContent = value;
    return item;
  }));
}
function formatDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}
function pricingLabel(value) { return ({ free: "Free", freemium: "Freemium", paid: "Paid" })[value] || ""; }
function accessLabel(value) { return ({ browser: "Works in browser", download: "Download required", both: "Browser + download" })[value] || ""; }
function addFact(label, value) {
  if (value === "" || value === null || value === undefined) return;
  const wrapper = document.createElement("div");
  const term = document.createElement("dt"); term.textContent = label;
  const description = document.createElement("dd"); description.textContent = String(value);
  wrapper.append(term, description); elements.facts.append(wrapper);
}
function renderLogo(resource) {
  const fallback = document.createElement("span");
  fallback.className = "detail-logo-fallback";
  fallback.setAttribute("aria-hidden", "true");
  fallback.textContent = resource.name.trim().charAt(0).toLocaleUpperCase();
  if (resource.icon) {
    const icon = iconHTML(resource.icon);
    if (icon) fallback.innerHTML = icon;
  }
  elements.logo.replaceChildren(fallback);
  if (!resource.image?.src || !resource.image?.alt) return;
  const imageURL = safeExternalURL(resource.image.src);
  if (!imageURL || !imageURL.startsWith("https:")) return;
  const image = document.createElement("img");
  image.className = "detail-logo-image";
  image.src = imageURL; image.alt = resource.image.alt; image.loading = "eager";
  image.decoding = "async"; image.referrerPolicy = "no-referrer";
  image.addEventListener("load", () => elements.logo.classList.add("has-image"), { once: true });
  image.addEventListener("error", () => { image.remove(); elements.logo.classList.remove("has-image"); }, { once: true });
  elements.logo.append(image);
}
function renderResource(resource) {
  currentResource = resource;
  elements.save.dataset.saveResource = resource.id;
  elements.save.dataset.resourceName = resource.name;
  elements.save.dataset.saveLabel = "true";
  const category = categoryNames[resource.category] || resource.category;
  setText(elements.category, category);
  setText(elements.subcategory, resource.subcategory);
  setText(elements.title, resource.name);
  setText(elements.description, resource.description);
  setText(elements.fullDescription, resource.fullDescription);
  renderLogo(resource);
  elements.tags.replaceChildren(...(resource.tags || []).map(makePill));

  const officialURL = safeExternalURL(resource.url);
  if (officialURL) {
    elements.visit.href = officialURL;
    elements.visit.hidden = false;
  } else {
    elements.visit.removeAttribute("href");
    elements.visit.hidden = true;
  }

  renderList(elements.features, resource.features || []);
  showOptionalSection(elements.featuresSection, (resource.features || []).length > 0);
  renderList(elements.limitations, resource.limitations || []);
  showOptionalSection(elements.limitationsSection, (resource.limitations || []).length > 0);

  elements.facts.replaceChildren();
  addFact("Pricing", pricingLabel(resource.pricing));
  addFact("Access", accessLabel(resource.accessType));
  if (typeof resource.openSource === "boolean") addFact("Open source", resource.openSource ? "Yes" : "No");
  if (typeof resource.freeTrial === "boolean") addFact("Free trial", resource.freeTrial ? "Available" : "Not offered");
  addFact("Added", formatDate(resource.dateAdded));
  addFact("Last verified", formatDate(resource.lastVerified));

  elements.platforms.replaceChildren(...(resource.platforms || []).map(makePill));
  showOptionalSection(elements.platformsSection, (resource.platforms || []).length > 0);
  elements.keywords.replaceChildren(...(resource.keywords || []).map(makePill));
  showOptionalSection(elements.keywordsSection, (resource.keywords || []).length > 0);

  const related = getRelatedResources(resource, allResources, 4);
  elements.related.replaceChildren(...related.map((item) => createResourceCard(item, categoryNames)));
  showOptionalSection(elements.relatedSection, related.length > 0);
  updateSaveButton();
  elements.content.hidden = false;
  elements.loading.hidden = true;
  document.title = `${resource.name} · ${SITE_NAME}`;
}
function updateSaveButton() {
  const saved = isResourceSaved(currentResource.id);
  elements.save.setAttribute("aria-pressed", String(saved));
  elements.save.textContent = saved ? "Remove from saved" : "Save resource";
  elements.save.classList.toggle("is-saved", saved);
}
function showError(message) {
  elements.loading.hidden = true;
  elements.content.hidden = true;
  elements.errorMessage.textContent = message;
  elements.error.hidden = false;
}
function showFeedback(message, isError = false) {
  elements.feedback.textContent = message;
  elements.feedback.classList.toggle("is-error", isError);
  elements.feedback.hidden = false;
}
async function initialise() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) { showError("This resource link is missing its ID. Open Explore to browse the directory."); return; }
  try {
    const [categories, resources] = await Promise.all([loadCategories(), loadResources()]);
    allResources = resources;
    categoryNames = Object.fromEntries(categories.map((category) => [category.id, category.name]));
    initSavedControls(resources);
    const resource = getResourceById(resources, id);
    if (!resource) { showError("That resource ID does not exist in the current directory. It may have been removed or the link may be incorrect."); return; }
    renderResource(resource);
  } catch (error) {
    console.error("Resource detail page failed to load:", error);
    showError("The resource data could not be loaded. Check your connection or try again in a moment.");
  }
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  elements.copy.addEventListener("click", async () => {
    const copied = await copyText(window.location.href);
    showFeedback(copied ? "Resource link copied." : "Could not copy the link. Please copy it from your browser’s address bar.", !copied);
  });
  initialise();
}
