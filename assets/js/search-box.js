// search-box.js — behaviour for every search field on the site.
//
// The HTML form already works by itself: it sends the visitor to
// explore.html?q=their+words. This file only adds the nice extras:
//   - a clear (x) button and a submit arrow that wake up when you type
//   - Escape clears the field
//   - the "Try ..." suggestion chips
//   - pressing "/" anywhere jumps to the search field
//   - the field is pre-filled from the address bar when you arrive with ?q=...

export function initSearchBoxes() {
  for (const form of document.querySelectorAll("[data-search]")) {
    setupSearchBox(form);
  }
  setupSlashShortcut();
}

function setupSearchBox(form) {
  const field = form.querySelector(".search-field");
  const input = form.querySelector(".search-input");
  const clearButton = form.querySelector(".search-clear");

  // Pre-fill from ?q=... (setting .value is always safe: it is text, never HTML)
  const query = new URLSearchParams(window.location.search).get("q");
  if (query) input.value = query;

  // Show or hide the clear button depending on whether there is text
  function refresh() {
    const hasText = input.value.length > 0;
    field.classList.toggle("has-value", hasText);
    clearButton.hidden = !hasText;
  }
  refresh();
  input.addEventListener("input", refresh);

  function clear() {
    input.value = "";
    refresh();
    input.focus();
    // Tell any other code listening (Explore's live search, later) that it changed
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  clearButton.addEventListener("click", clear);

  // Escape clears the field if it has text
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && input.value) {
      event.preventDefault();
      clear();
    }
  });

  // An empty search does nothing except put the cursor back in the field
  form.addEventListener("submit", (event) => {
    const text = input.value.trim();
    if (!text) {
      event.preventDefault();
      input.focus();
      return;
    }
    input.value = text; // send it without stray spaces
  });

  // "Try AI coding" chips: fill the field, then search
  for (const chip of form.querySelectorAll("[data-search-suggestion]")) {
    chip.addEventListener("click", () => {
      input.value = chip.dataset.searchSuggestion;
      refresh();
      form.requestSubmit();
    });
  }
}

// Pressing "/" focuses the search field (like on GitHub or YouTube)
function setupSlashShortcut() {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;

    // Don't steal the key while someone is typing in a field
    if (event.target.closest("input, textarea, select, [contenteditable='true']")) return;

    const input = document.querySelector("[data-search] .search-input");
    if (!input) return;

    event.preventDefault();
    input.focus();
    input.select();
  });
}
