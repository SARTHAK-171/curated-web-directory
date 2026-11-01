// data.js — shared data loading and validation for the directory.
// Edit data/categories.json and data/resources.json; do not duplicate their data elsewhere.

export const APPROVED_CATEGORIES = Object.freeze([
  "AI",
  "Developer",
  "Cybersecurity",
  "Study & Learning",
  "Fun & Entertainment",
  "Relaxation",
]);

export const PRICING_VALUES = Object.freeze(["free", "freemium", "paid"]);
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
  "url",
];
const REQUIRED_BOOLEAN_FIELDS = ["freeTrial", "openSource", "featured"];
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

function validateResource(resource, index, errors, warnings) {
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

  if (typeof resource.category === "string" &&
      !APPROVED_CATEGORIES.includes(resource.category)) {
    addIssue(
      errors,
      index,
      "category",
      `must be one of: ${APPROVED_CATEGORIES.join(", ")}.`,
    );
  }

  if (typeof resource.pricing === "string" &&
      !PRICING_VALUES.includes(resource.pricing)) {
    addIssue(errors, index, "pricing", `must be one of: ${PRICING_VALUES.join(", ")}.`);
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

  if (typeof resource.name === "string" && resource.name.trim() !== "" &&
      typeof resource.id === "string" && resource.id.trim() === "") {
    addIssue(errors, index, "id", "must be stable and non-empty.");
  }

  if (typeof resource.dateAdded === "string" &&
      typeof resource.lastVerified === "string" &&
      isRealISODate(resource.dateAdded) &&
      isRealISODate(resource.lastVerified) &&
      resource.lastVerified < resource.dateAdded) {
    addIssue(warnings, index, "lastVerified", "is earlier than dateAdded.");
  }

}

/**
 * Validate a resource list without changing or repairing its contents.
 * Errors make the data invalid; warnings are advisory and do not block loading.
 */
export function validateResources(value) {
  const errors = [];
  const warnings = [];

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
    validateResource(resource, index, errors, warnings);

    if (isPlainObject(resource) &&
        typeof resource.id === "string" &&
        resource.id.trim() !== "") {
      if (ids.has(resource.id)) {
        addIssue(errors, index, "id", `duplicate identifier "${resource.id}".`);
      }
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

function validateCategories(value) {
  if (!Array.isArray(value)) {
    throw new DataValidationError(
      "categories.json must contain a JSON array.",
      { valid: false, errors: ["categories.json must contain a JSON array."], warnings: [] },
    );
  }

  const errors = [];
  const names = value.map((category, index) => {
    if (!isPlainObject(category) ||
        typeof category.name !== "string" ||
        category.name.trim() === "") {
      errors.push(`Category ${index + 1}: must be an object with a non-empty name.`);
      return null;
    }
    return category.name;
  });

  for (const name of APPROVED_CATEGORIES) {
    if (!names.includes(name)) errors.push(`categories.json is missing "${name}".`);
  }
  for (const name of names) {
    if (name !== null && !APPROVED_CATEGORIES.includes(name)) {
      errors.push(`"${name}" is not an approved top-level category.`);
    }
  }
  if (names.filter(Boolean).length !== new Set(names.filter(Boolean)).size) {
    errors.push("categories.json contains duplicate category names.");
  }

  if (errors.length) {
    throw new DataValidationError(
      "categories.json does not match the approved six-category structure.",
      { valid: false, errors, warnings: [] },
    );
  }

  return value;
}

let categoriesPromise;
let resourcesPromise;

/** Load and validate the six shared categories. The result is cached per page. */
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

/** Load resources.json and reject invalid data rather than silently altering it. */
export function loadResources() {
  if (!resourcesPromise) {
    resourcesPromise = fetchJSON("data/resources.json")
      .then((value) => {
        const report = validateResources(value);
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
