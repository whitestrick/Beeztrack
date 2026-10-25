// inventory.js
// Business logic about stock. 
// Decides the stock health of ONE product.
// Returns exactly one of: "out", "low" or "ok".
//   out = quantity is 0 (nothing left)
//   low = quantity is at or below the minimum stock level
//   ok  = quantity is above the minimum stock level
export function getStockStatus(product) {
  // Number() makes sure we compare numbers, even if a value arrives as "5" reducing errors
  const quantity = Number(product.quantity);
  const minStock = Number(product.minStock);

  if (quantity <= 0) return "out";
  if (quantity <= minStock) return "low";
  return "ok";
}
// Works out the numbers for the four summary cards from a list of products.
// pure function: array in, object out, nothing else touched.
export function calculateSummary(products) {
  // reduce() walks through the array and builds up ONE value.
  // "total" is the running sum, it starts at 0 ( second argument).
  // For each product we add price x quantity to it.
  const totalValue = products.reduce((total, product) => {
    return total + Number(product.price) * Number(product.quantity);
  }, 0);

  // Count how many products have each status, using the function from #8
  let lowCount = 0;
  let outCount = 0;
  products.forEach((product) => {
    const status = getStockStatus(product);
    if (status === "low") lowCount++;
    if (status === "out") outCount++;
  });

  return {
    totalProducts: products.length,
    totalValue,
    lowCount,
    outCount,
  };
}

// Returns only the products that match ALL the active filters.
// filters = { search: "usb", category: "", status: "" }
// An empty string means "don't filter on this". later only have to connect the dropdowns.
// Pure function: it never changes the original array, it returns a new one.
export function filterProducts(products, filters) {
  const search = String(filters.search ?? "").trim().toLowerCase();
  const category = filters.category ?? "";
  const status = filters.status ?? "";

  return products.filter((product) => {
    // includes() asks "does this text contain that text?"
    const matchesSearch = String(product.name).toLowerCase().includes(search);
    const matchesCategory = category === "" || product.category === category;
    const matchesStatus = status === "" || getStockStatus(product) === status;

    // A product stays only if it passes all three tests
    return matchesSearch && matchesCategory && matchesStatus;
  });
}

// Returns the list of distinct categories in the products, sorted A to Z.
// Pure function, so it is easy to test.
export function getCategories(products) {
  // A Set keeps each value once, so ten "Office" products give one "Office"
  const unique = new Set(products.map((product) => product.category));
  return [...unique].sort();
}

// Our products need a minimum stock level, but DummyJSON has no such field.
// So every imported product gets this default.
export const DEFAULT_MIN_STOCK = 5;

// "home-decoration" -> "Home decoration" (matches how we write our own categories)
function formatCategory(text) {
  const withSpaces = String(text).replace(/-/g, " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

// Converts ONE DummyJSON product into a Beeztrack product.
// title -> name, stock -> quantity, thumbnail -> image.
// "|| 0" and "|| ''" are safety nets: if a value is missing we use a default
// instead of sending NaN or undefined to the server.
export function mapSampleProduct(sample) {
  return {
    name: String(sample.title).trim(),
    category: formatCategory(sample.category),
    price: Number(sample.price) || 0,
    quantity: Number(sample.stock) || 0,
    minStock: DEFAULT_MIN_STOCK,
    image: sample.thumbnail || "",
  };
}

// Returns only the candidates that are NOT already in the inventory.
// Two products count as the same if their names match (ignoring case/spaces).
// It also removes duplicates INSIDE the candidates list itself.
export function findNewProducts(candidates, existingProducts) {
  // A Set is perfect here: "is this name already known?" is instant
  const knownNames = new Set(
    existingProducts.map((product) => product.name.trim().toLowerCase())
  );

  const newProducts = [];
  for (const candidate of candidates) {
    const key = candidate.name.toLowerCase();
    if (knownNames.has(key)) continue; // already in the inventory, skip it
    knownNames.add(key);               // remember it so a repeat in the list is skipped too
    newProducts.push(candidate);
  }
  return newProducts;
}