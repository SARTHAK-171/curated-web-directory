// resource-card.js — the shared resource card used by Explore and Saved.

import { iconHTML } from "./icons.js";
import { createSaveButton } from "./saved-resources.js";

export const ACCESS_TYPE_LABELS = Object.freeze({
  browser: "Works in browser",
  download: "Download required",
  both: "Browser + download",
});

export function createResourceCard(resource, categoryNames = {}) {
  const article = document.createElement("article");
  article.className = "directory-card";
  article.dataset.resourceId = resource.id;

  const top = document.createElement("div");
  top.className = "directory-card-top";

  const visual = document.createElement("span");
  visual.className = "directory-card-icon";
  visual.setAttribute("aria-hidden", "true");
  const fallback = document.createElement("span");
  fallback.className = "directory-card-fallback";
  fallback.setAttribute("aria-hidden", "true");
  const safeIcon = resource.icon ? iconHTML(resource.icon) : "";
  if (safeIcon) fallback.innerHTML = safeIcon;
  else fallback.textContent = resource.name.trim().charAt(0).toLocaleUpperCase();
  visual.append(fallback);

  if (resource.image?.src && resource.image?.alt) {
    const image = document.createElement("img");
    image.className = "directory-card-image";
    image.src = resource.image.src;
    image.alt = resource.image.alt;
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    visual.removeAttribute("aria-hidden");
    image.addEventListener("load", () => visual.classList.add("has-image"), { once: true });
    image.addEventListener("error", () => {
      image.remove();
      visual.classList.remove("has-image");
      visual.setAttribute("aria-hidden", "true");
    }, { once: true });
    visual.append(image);
  }

  top.append(visual, createSaveButton(resource));

  const heading = document.createElement("h3");
  heading.textContent = resource.name;

  const description = document.createElement("p");
  description.className = "directory-card-description";
  description.textContent = resource.description;

  const meta = document.createElement("div");
  meta.className = "directory-card-meta";
  meta.append(createTag(resource.pricing, "pricing"));
  meta.append(createTag(categoryNames[resource.category] || resource.category));
  meta.append(createTag(ACCESS_TYPE_LABELS[resource.accessType], "access-type"));
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

function createTag(label, className = "") {
  const tag = document.createElement("span");
  tag.className = `directory-tag${className ? ` ${className}` : ""}`;
  tag.textContent = label;
  return tag;
}
