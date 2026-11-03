// data.js — shared data loading and validation for the directory.
// Edit data/categories.json and data/resources.json; do not duplicate their data elsewhere.

export const PRICING_VALUES = Object.freeze(["free", "freemium", "paid"]);
export const ACCESS_TYPE_VALUES = Object.freeze(["browser", "download", "both"]);
export const PLATFORM_VALUES = Object.freeze([
  "Web",
  "Windows",
  "macOS",
  "Linux",
  "Android",
  "iOS",
]);

const RESOURCE_ARRAY_FIELDS = [
  "tags",
  "keywords",
  "platforms",
  "features",
  "limitations",
];
const REQUIRED_STRING_FIELDS = [
  "id",
  "name",
  "description",
  "fullDescription",
  "category",
  "subcategory",
  "pricing",
  "accessType",
  "url",
];
const REQUIRED_BOOLEAN_FIELDS = ["freeTrial", "openSource", "featured"];
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class DataLoadError extends Error {
  constructor(message, { file, cause } = {}) {
    super(message, { cause });
    this.name = "DataLoadError";
    this.file = file || null;
    this.fatal = true;
  }
}

export class DataValidationError extends Error {
  constructor(message, report) {
    super(message);
    this.name = "DataValidationError";
    this.report = report;
    this.fatal = false;
  }
}

async function fetchJSON(path) {
  let response;

  try {
    response = await fetch(path);
  } catch (cause) {
    throw new DataLoadError(
      `Could not load ${path}. Check that the site is running through a local web server and that the file exists.`,
      { file: path, cause },
    );
  }

  if (!response.ok) {
    throw new DataLoadError(
      `Could not load ${path} (HTTP ${response.status}). Check the file path and try again.`,
      { file: path },
    );
  }

  try {
    return await response.json();
  } catch (cause) {
    throw new DataLoadError(
      `${path} contains invalid JSON. Check its brackets, commas and quotation marks.`,
      { file: path, cause },
    );
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isRealISODate(value) {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

function addIssue(list, index, field, message) {
  const location = index === null ? field : `Resource ${index + 1} (${field})`;
  list.push(`${location}: ${message}`);
}

function validateResource(resource, index, errors, warnings, categoryIds) {
  if (!isPlainObject(resource)) {
    addIssue(errors, index, "object", "must be a JSON object.");
    return;
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof resource[field] !== "string" || resource[field].trim() === "") {
      addIssue(errors, index, field, "must be a non-empty string.");
    }
  }

  for (const field of REQUIRED_BOOLEAN_FIELDS) {
    if (typeof resource[field] !== "boolean") {
      addIssue(errors, index, field, "must be true or false.");
    }
  }

  for (const field of RESOURCE_ARRAY_FIELDS) {
    if (!Array.isArray(resource[field])) {
      addIssue(errors, index, field, "must be an array of strings.");
    } else if (!resource[field].every((item) =>
      typeof item === "string" && item.trim() !== "")) {
      addIssue(errors, index, field, "must contain only non-empty strings.");
    }
  }

  if (typeof resource.category === "string" && !categoryIds.has(resource.category)) {
    addIssue(errors, index, "category", "must reference an existing category ID from categories.json.");
  }

  if (typeof resource.pricing === "string" && !PRICING_VALUES.includes(resource.pricing)) {
    addIssue(errors, index, "pricing", `must be one of: ${PRICING_VALUES.join(", ")}.`);
  }

  if (typeof resource.accessType === "string" &&
      !ACCESS_TYPE_VALUES.includes(resource.accessType)) {
    addIssue(errors, index, "accessType", `must be one of: ${ACCESS_TYPE_VALUES.join(", ")}.`);
  }

  if (Array.isArray(resource.platforms)) {
    resource.platforms.forEach((platform) => {
      if (typeof platform === "string" && !PLATFORM_VALUES.includes(platform)) {
        addIssue(
          errors,
          index,
          "platforms",
          `"${platform}" is unsupported. Use: ${PLATFORM_VALUES.join(", ")}.`,
        );
      }
    });
  }

  if (typeof resource.url === "string" && resource.url.trim() !== "") {
    try {
      const parsed = new URL(resource.url);
      if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
        throw new Error("Unsupported URL protocol.");
      }
    } catch {
      addIssue(errors, index, "url", "must be a valid absolute HTTP or HTTPS URL.");
    }
  }

  if (resource.image !== undefined && resource.image !== null) {
    if (!isPlainObject(resource.image)) {
      addIssue(errors, index, "image", "must be null or an object with src and alt fields.");
    } else {
      if (typeof resource.image.src !== "string" || resource.image.src.trim() === "") {
        addIssue(errors, index, "image.src", "must be a non-empty HTTPS URL.");
      } else {
        try {
          const imageURL = new URL(resource.image.src);
          if (imageURL.protocol !== "https:" || !imageURL.hostname) throw new Error("Invalid image URL");
        } catch {
          addIssue(errors, index, "image.src", "must be a valid absolute HTTPS URL.");
        }
      }
      if (typeof resource.image.alt !== "string" || resource.image.alt.trim() === "") {
        addIssue(errors, index, "image.alt", "must be a non-empty accessible description.");
      }
    }
  }

  for (const field of ["dateAdded", "lastVerified"]) {
    const value = resource[field];
    if (value !== null && !isRealISODate(value)) {
      addIssue(errors, index, field, "must be null or a real date in YYYY-MM-DD format.");
    }
  }

  if (resource.icon !== undefined &&
      (typeof resource.icon !== "string" || resource.icon.trim() === "")) {
    addIssue(errors, index, "icon", "must be a non-empty string when provided.");
  }

  if (typeof resource.dateAdded === "string" &&
      typeof resource.lastVerified === "string" &&
      isRealISODate(resource.dateAdded) &&
      isRealISODate(resource.lastVerified) &&
      resource.lastVerified < resource.dateAdded) {
    addIssue(warnings, index, "lastVerified", "is earlier than dateAdded.");
  }
}

/** Validate a resource list against the category IDs loaded from categories.json. */
export function validateResources(value, categories) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(categories)) {
    return {
      valid: false,
      errors: ["Category data must be loaded before resources can be validated."],
      warnings,
      resources: null,
    };
  }

  const categoryIds = new Set(categories.map((category) => category?.id).filter(Boolean));
  if (!Array.isArray(value)) {
    return {
      valid: false,
      errors: ["resources.json must contain a JSON array."],
      warnings,
      resources: null,
    };
  }

  const ids = new Set();
  value.forEach((resource, index) => {
    validateResource(resource, index, errors, warnings, categoryIds);

    if (isPlainObject(resource) && typeof resource.id === "string" && resource.id.trim() !== "") {
      if (ids.has(resource.id)) addIssue(errors, index, "id", `duplicate identifier "${resource.id}".`);
      ids.add(resource.id);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    resources: errors.length === 0 ? value : null,
  };
}

/** Validate the category catalogue without relying on a duplicated hard-coded list. */
export function validateCategories(value) {
  if (!Array.isArray(value)) {
    throw new DataValidationError(
      "categories.json must contain a JSON array.",
      { valid: false, errors: ["categories.json must contain a JSON array."], warnings: [] },
    );
  }

  const errors = [];
  if (value.length === 0) errors.push("categories.json must contain at least one category.");
  const ids = new Set();
  const names = new Set();
  const orders = new Set();

  value.forEach((category, index) => {
    const label = `Category ${index + 1}`;
    if (!isPlainObject(category)) {
      errors.push(`${label}: must be an object.`);
      return;
    }

    for (const field of ["id", "name", "description", "icon", "color"]) {
      if (typeof category[field] !== "string" || category[field].trim() === "") {
        errors.push(`${label} (${field}): must be a non-empty string.`);
      }
    }
    if (typeof category.id === "string" && !CATEGORY_ID_PATTERN.test(category.id)) {
      errors.push(`${label} (id): use lowercase words separated by hyphens.`);
    }
    if (typeof category.id === "string" && ids.has(category.id)) {
      errors.push(`${label} (id): duplicate ID "${category.id}".`);
    }
    if (typeof category.id === "string") ids.add(category.id);
    if (typeof category.name === "string" && names.has(category.name)) {
      errors.push(`${label} (name): duplicate category name "${category.name}".`);
    }
    if (typeof category.name === "string") names.add(category.name);
    if (!Number.isInteger(category.displayOrder) || category.displayOrder < 1) {
      errors.push(`${label} (displayOrder): must be a positive whole number.`);
    } else if (orders.has(category.displayOrder)) {
      errors.push(`${label} (displayOrder): values must be unique.`);
    } else {
      orders.add(category.displayOrder);
    }
    if (typeof category.color === "string" && !/^#[0-9a-fA-F]{6}$/.test(category.color)) {
      errors.push(`${label} (color): must be a six-digit hexadecimal colour.`);
    }
  });

  if (errors.length) {
    throw new DataValidationError(
      `categories.json has ${errors.length} validation error(s).`,
      { valid: false, errors, warnings: [] },
    );
  }

  return [...value].sort((a, b) => a.displayOrder - b.displayOrder);
}

let categoriesPromise;
let resourcesPromise;

/** Load and validate the category catalogue. The result is cached per page. */
export function loadCategories() {
  if (!categoriesPromise) {
    categoriesPromise = fetchJSON("data/categories.json")
      .then(validateCategories)
      .catch((error) => {
        categoriesPromise = null;
        throw error;
      });
  }
  return categoriesPromise;
}

/** Load resources and validate their category links against the shared catalogue. */
export function loadResources() {
  if (!resourcesPromise) {
    resourcesPromise = Promise.all([
      fetchJSON("data/resources.json"),
      loadCategories(),
    ])
      .then(([value, categories]) => {
        const report = validateResources(value, categories);
        if (!report.valid) {
          throw new DataValidationError(
            `resources.json has ${report.errors.length} validation error(s).`,
            report,
          );
        }
        return report.resources;
      })
      .catch((error) => {
        resourcesPromise = null;
        throw error;
      });
  }
  return resourcesPromise;
}
