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