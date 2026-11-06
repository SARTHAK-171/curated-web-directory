// Theme preference: dark is the unchanged default; light is opt-in.
const STORAGE_KEY = "orbit.theme.v1";

function applyTheme(theme) {
  const selected = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = selected;
  document.documentElement.style.colorScheme = selected;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = selected === "light" ? "#f4f5f7" : "#09090d";
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const next = selected === "dark" ? "light" : "dark";
    button.setAttribute("aria-pressed", String(selected === "light"));
    button.setAttribute("aria-label", `Switch to ${next} mode`);
    button.title = `Switch to ${next} mode`;
    const label = button.querySelector(".theme-toggle-label");
    if (label) label.textContent = selected === "dark" ? "Light" : "Dark";
    const icon = button.querySelector(".theme-toggle-icon");
    if (icon) icon.textContent = selected === "dark" ? "☼" : "☾";
  });
}

export function initTheme() {
  let saved = "dark";
  try { saved = localStorage.getItem(STORAGE_KEY) || "dark"; } catch {}
  applyTheme(saved);
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-toggle]");
    if (!button) return;
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    applyTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  });
}
