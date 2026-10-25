// app.js
// connecting my  other modules together:
//   api.js -> gets data
//   ui.js  -> shows data
// app.js decides WHEN each happens. It does not know HOW either works.

import { getProducts, addProduct } from "./api.js";
import { calculateSummary } from "./inventory.js";
import { validateProduct, isValid } from "./validation.js";
import {
  showLoading,
  showError,
  showEmpty,
  renderProducts,
  renderSummary,
  showMessage,
  readProductForm,
  clearFieldErrors,
  showFieldErrors,
  openProductDialog,
  closeProductDialog,
  setSaving,
  updateCategoryList,
} from "./ui.js";

// ---------- State ----------
// The app's data lives here. Every feature we added
// (search, filters, add, edit, delete) reads from and updates this array.
let products = [];

// Redraws everything that depends on the products array.
// (add, edit, delete, quantity buttons) just change the array
// and call this one function, so the table and the cards can never disagree.
function refreshView() {
  renderSummary(calculateSummary(products));
  updateCategoryList(products);

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


// Turns the raw form strings into clean data for the server:
// text is trimmed, numbers become real numbers.
function buildProductFromForm(values) {
  return {
    name: values.name.trim(),
    category: values.category.trim(),
    price: Number(values.price),
    quantity: Number(values.quantity),
    minStock: Number(values.minStock),
    image: values.image.trim(),
  };
}

async function handleProductSubmit(event) {
  // Stop the browser's default form behaviour (reloading the page)
  event.preventDefault();

  // 1. Read what the user typed
  const values = readProductForm();

  // 2. Check it. If anything is wrong, show the messages and STOP here.
  const errors = validateProduct(values);
  clearFieldErrors();
  if (!isValid(errors)) {
    showFieldErrors(errors);
    return;
  }

  // 3. Send it to the server
  setSaving(true);
  try {
    const created = await addProduct(buildProductFromForm(values));

    // Use the object the SERVER sent back: it has the new id
    products.push(created);
    refreshView();
    closeProductDialog();
    showMessage("Product saved");
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    // finally runs whether it worked or failed
    setSaving(false);
  }
}

// ---------- Start the app ----------
function init() {
  // "Try Again" in the error box simply runs the same loading function again
  document
    .querySelector("#error-retry-btn")
    .addEventListener("click", loadProducts);

  // Open the dialog from both "Add Product" buttons.
  // The arrow function () => ... is needed because #13 will pass data to it.
  document.querySelector("#add-product-btn").addEventListener("click", () => openProductDialog());
  document.querySelector("#empty-add-btn").addEventListener("click", () => openProductDialog());

  // Cancel, and the form's submit
  document.querySelector("#product-cancel-btn").addEventListener("click", closeProductDialog);
  document.querySelector("#product-form").addEventListener("submit", handleProductSubmit);
  loadProducts();
}

init();