// app.js
// connecting my  other modules together:
//   api.js -> gets data
//   ui.js  -> shows data
// app.js decides WHEN each happens. It does not know HOW either works.

import { getProducts } from "./api.js";
import { calculateSummary } from "./inventory.js";
import { showLoading, showError, showEmpty, renderProducts, renderSummary } from "./ui.js";

// ---------- State ----------
// The app's data lives here. Every feature we added
// (search, filters, add, edit, delete) reads from and updates this array.
let products = [];

// Redraws everything that depends on the products array.
// (add, edit, delete, quantity buttons) just change the array
// and call this one function, so the table and the cards can never disagree.
function refreshView() {
  renderSummary(calculateSummary(products));

  if (products.length === 0) {
    showEmpty();
  } else {
    renderProducts(products);
  }
}
// ---------- Load products from the server ----------
async function loadProducts() {
  showLoading();

// await new Promise((resolve) => setTimeout(resolve, 2000)); // TEMPORARY: to see the loading state display  
  // try/catch: if anything inside "try" throws an error (our api.js throws
  // when the server is down or answers with 404/500), JS jumps to "catch".
  try {
    products = await getProducts();
    refreshView();
  } catch (error) {
    showError(error.message);
  }
}

// ---------- Start the app ----------
function init() {
  // "Try Again" in the error box simply runs the same loading function again
  document
    .querySelector("#error-retry-btn")
    .addEventListener("click", loadProducts);

  loadProducts();
}

init();