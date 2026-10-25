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