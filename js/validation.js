// validation.js
// Checks product data BEFORE it is sent to the server.
// It receives values and returns messages, so it is easy to test and
// can be reused by both the "add" form and the "edit" form.

const MAX_NAME_LENGTH = 60;

// ---------- Small helpers ----------

// True if the value is empty or only spaces.
// Form inputs always give us STRINGS, e.g. "" or "  " or "12".
// "?? ''" turns null/undefined into an empty string so .trim() never crashes.
function isBlank(value) {
  return String(value ?? "").trim() === "";
}

// Returns an error message for a "whole number, 0 or more" field,
// or "" (empty string) if the value is fine.
function checkWholeNumber(value, label) {
  if (isBlank(value)) return `${label} is required.`;

  const number = Number(value); // "12" -> 12, "abc" -> NaN, "2.5" -> 2.5
  if (!Number.isInteger(number) || number < 0) {
    return `${label} must be a whole number (0 or more).`;
  }
  return "";
}

// ---------- The main function ----------
// data = { name, category, price, quantity, minStock, image }
// Returns an object that contains ONLY the fields that have a problem.
//   {}                                  -> everything is valid
//   { price: "Price is required." }     -> only price is wrong
export function validateProduct(data) {
  const errors = {};

  // Name: required, not too long
  if (isBlank(data.name)) {
    errors.name = "Product name is required.";
  } else if (String(data.name).trim().length > MAX_NAME_LENGTH) {
    errors.name = `Product name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }

  // Category: required
  if (isBlank(data.category)) {
    errors.category = "Category is required.";
  }

  // Price: required, a real number, greater than 0.
  // We check isBlank FIRST because Number("") is 0, which would sneak
  // past a "is it a number?" test.
  if (isBlank(data.price)) {
    errors.price = "Price is required.";
  } else {
    const price = Number(data.price);
    if (!Number.isFinite(price) || price <= 0) {
      errors.price = "Price must be a number greater than 0.";
    }
  }

  // Quantity and min stock: whole numbers, 0 or more
  const quantityError = checkWholeNumber(data.quantity, "Quantity");
  if (quantityError) errors.quantity = quantityError;

  const minStockError = checkWholeNumber(data.minStock, "Min stock");
  if (minStockError) errors.minStock = minStockError;

  // Image: optional. Only checked if the user typed something.
  if (!isBlank(data.image)) {
    try {
      const url = new URL(String(data.image).trim()); // throws if it isn't a valid URL
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        errors.image = "Image must be a web address starting with http:// or https://";
      }
    } catch (error) {
      errors.image = "Image must be a web address starting with http:// or https://";
    }
  }

  return errors;
}

// Handy for callers: true when the errors object is empty
export function isValid(errors) {
  return Object.keys(errors).length === 0;
}