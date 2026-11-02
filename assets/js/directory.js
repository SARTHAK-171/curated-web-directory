// directory.js — pure search, filtering and sorting helpers for resources.

function normalise(value) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

export function filterResources(resources, filters) {
  const query = normalise(filters.query);
  const tokens = query.split(/\s+/).filter(Boolean);

  const filtered = resources.filter((resource) => {
    if (filters.category && resource.category !== filters.category) return false;
    if (filters.subcategory && resource.subcategory !== filters.subcategory) return false;
    if (filters.pricing && resource.pricing !== filters.pricing) return false;
    if (filters.openSource && !resource.openSource) return false;
    if (filters.platform && !resource.platforms.includes(filters.platform)) return false;
    if (filters.tag && !resource.tags.some((tag) => normalise(tag) === normalise(filters.tag))) return false;

    if (tokens.length) {
      const searchable = [
        resource.name,
        resource.description,
        resource.fullDescription,
        resource.category,
        resource.subcategory,
        ...resource.tags,
        ...resource.keywords,
        ...resource.features,
        ...resource.platforms,
        resource.pricing,
        resource.openSource ? "open source" : "",
        resource.freeTrial ? "free trial" : "",
      ].join(" ").toLocaleLowerCase();
      if (!tokens.every((token) => searchable.includes(token))) return false;
    }
    return true;
  });

  return sortResources(filtered, filters.sort);
}

function dateValue(date) {
  return date ? Date.parse(`${date}T00:00:00Z`) : 0;
}

export function sortResources(resources, sort = "featured") {
  const copy = [...resources];
  switch (sort) {
    case "recent":
      return copy.sort((a, b) =>
        dateValue(b.dateAdded) - dateValue(a.dateAdded) ||
        a.name.localeCompare(b.name),
      );
    case "az":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "za":
      return copy.sort((a, b) => b.name.localeCompare(a.name));
    case "featured":
    default:
      return copy.sort((a, b) =>
        Number(b.featured) - Number(a.featured) ||
        dateValue(b.dateAdded) - dateValue(a.dateAdded) ||
        a.name.localeCompare(b.name),
      );
  }
}

