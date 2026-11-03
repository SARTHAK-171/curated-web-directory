// saved-resources.js — one shared localStorage store and save-button controller.
// Only stable resource IDs are stored; resource details always come from resources.json.

import { SAVED_STORAGE_KEY } from "./config.js";
import { iconHTML } from "./icons.js";

function cleanIds(value, validIds = null) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const cleaned = [];
  for (const id of value) {
    if (typeof id !== "string" || !id.trim() || seen.has(id)) continue;
    if (validIds && !validIds.has(id)) continue;
    seen.add(id);
    cleaned.push(id);
  }
  return cleaned;
}

/** A small, injectable store so storage edge cases can be tested without a browser. */
export function createSavedStore(storage, key = SAVED_STORAGE_KEY) {
  function write(ids) {
    if (!storage) return false;
    try {
      storage.setItem(key, JSON.stringify(ids));
      return true;
    } catch {
      return false;
    }
  }

  function read(validIds = null) {
    if (!storage) return [];
    let raw;
    try {
      raw = storage.getItem(key);
    } catch {
      return [];
    }
    if (raw === null) return [];

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      try { storage.removeItem(key); } catch { /* Storage may be blocked. */ }
      return [];
    }

    const ids = cleanIds(parsed, validIds);
    if (!Array.isArray(parsed) || JSON.stringify(parsed) !== JSON.stringify(ids)) {
      write(ids);
    }
    return ids;
  }

  function toggle(id, validIds = null) {
    const current = read(validIds);
    if (typeof id !== "string" || !id.trim() || (validIds && !validIds.has(id))) {
      return { ok: false, ids: current, isSaved: current.includes(id), reason: "unknown-resource" };
    }

    const next = current.includes(id)
      ? current.filter((savedId) => savedId !== id)
      : [...current, id];
    if (!write(next)) {
      return { ok: false, ids: current, isSaved: current.includes(id), reason: "storage-unavailable" };
    }
    return { ok: true, ids: next, isSaved: next.includes(id), reason: null };
  }

  return { read, toggle, count: (validIds = null) => read(validIds).length };
}

function getBrowserStorage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export const savedStore = createSavedStore(getBrowserStorage());
let activeValidIds = new Set();
let activeSavedIds = new Set();
let feedbackElement = null;

export function isResourceSaved(id) {
  return activeSavedIds.has(id);
}

export function createSaveButton(resource) {
  const button = document.createElement("button");
  const isSaved = isResourceSaved(resource.id);
  button.type = "button";
  button.className = "save-button";
  button.dataset.saveResource = resource.id;
  button.dataset.resourceName = resource.name;
  button.setAttribute("aria-pressed", String(isSaved));
  button.setAttribute("aria-label", `${isSaved ? "Remove" : "Save"} ${resource.name} ${isSaved ? "from" : "to"} saved resources`);
  button.title = isSaved ? "Remove from saved" : "Save resource";
  button.innerHTML = iconHTML(isSaved ? "heart-filled" : "heart");
  return button;
}

function showFeedback(message) {
  if (!feedbackElement) {
    feedbackElement = document.createElement("div");
    feedbackElement.className = "save-feedback";
    feedbackElement.setAttribute("role", "status");
    feedbackElement.setAttribute("aria-live", "polite");
    document.body.append(feedbackElement);
  }
  feedbackElement.textContent = message;
  feedbackElement.classList.add("is-visible");
  clearTimeout(showFeedback.timer);
  showFeedback.timer = setTimeout(() => feedbackElement?.classList.remove("is-visible"), 2200);
}

function updateSaveButtons() {
  for (const button of document.querySelectorAll("[data-save-resource]")) {
    const isSaved = activeSavedIds.has(button.dataset.saveResource);
    const card = button.closest(".directory-card, .resource-card");
    const name = button.dataset.resourceName || card?.querySelector("h3")?.textContent || "resource";
    button.setAttribute("aria-pressed", String(isSaved));
    button.setAttribute("aria-label", `${isSaved ? "Remove" : "Save"} ${name} ${isSaved ? "from" : "to"} saved resources`);
    button.title = isSaved ? "Remove from saved" : "Save resource";
    if (button.dataset.saveLabel === "true") {
      button.textContent = isSaved ? "Remove from saved" : "Save resource";
      button.classList.toggle("is-saved", isSaved);
    } else {
      button.innerHTML = iconHTML(isSaved ? "heart-filled" : "heart");
    }
  }
}

function updateNavigationCount() {
  const badge = document.getElementById("saved-count");
  if (!badge) return;
  badge.textContent = String(activeSavedIds.size);
  const link = badge.closest("a");
  if (link) link.setAttribute("aria-label", `Saved, ${activeSavedIds.size} resources`);
}

/** Enable save buttons and keep all visible saved states/counts in sync. */
export function initSavedControls(resources, onChange = null) {
  activeValidIds = new Set(resources.map((resource) => resource.id));

  function refresh() {
    activeSavedIds = new Set(savedStore.read(activeValidIds));
    updateSaveButtons();
    updateNavigationCount();
    if (typeof onChange === "function") onChange([...activeSavedIds]);
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-save-resource]");
    if (!button || !document.contains(button)) return;

    const id = button.dataset.saveResource;
    const resource = resources.find((item) => item.id === id);
    if (!resource) return;

    const result = savedStore.toggle(id, activeValidIds);
    if (!result.ok) {
      showFeedback(result.reason === "storage-unavailable"
        ? "Your browser blocked local saving. Check its storage settings."
        : "That resource is no longer available.");
      return;
    }

    refresh();
    showFeedback(result.isSaved ? `Saved ${resource.name}.` : `Removed ${resource.name} from saved.`);
  });

  window.addEventListener("storage", (event) => {
    if (event.key === SAVED_STORAGE_KEY) refresh();
  });

  refresh();
  return { refresh, getIds: () => [...activeSavedIds] };
}
