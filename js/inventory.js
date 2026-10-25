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