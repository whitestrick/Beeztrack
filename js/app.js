// app.js
// connecting my  other modules together:
//   api.js -> gets data
//   ui.js  -> shows data
// app.js decides WHEN each happens. It does not know HOW either works.

import { getProducts, addProduct, updateProduct, patchProduct, deleteProduct} from "./api.js";
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
  readProductId,
  focusRowButton,
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
  event.preventDefault();

  const values = readProductForm();
  const errors = validateProduct(values);
  clearFieldErrors();
  if (!isValid(errors)) {
    showFieldErrors(errors);
    return;
  }

  const productData = buildProductFromForm(values);
  const editingId = readProductId(); // "" = adding, anything else = editing

  setSaving(true);
  try {
    if (editingId) {
      // ----- EDIT: PUT the whole record -----
      const updated = await updateProduct(editingId, productData);

      // Swap the old object for the server's new one, keep all the others.
      // String() on both sides: ids from the HTML are strings, ids from
      // the server are numbers, and "1" === 1 is false in JavaScript.
      products = products.map((product) =>
        String(product.id) === String(editingId) ? updated : product
      );
      showMessage("Product updated");
    } else {
      // ----- ADD: POST (same as #13) -----
      const created = await addProduct(productData);
      products.push(created);
      showMessage("Product saved");
    }

    refreshView();
    closeProductDialog();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
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
    // ONE listener on the table body handles edit, +, - (and delete later)
  document
    .querySelector("#product-table-body")
    .addEventListener("click", handleTableClick);

      // Delete dialog: confirm, cancel, and reset when it closes (Escape included)
  document.querySelector("#delete-confirm-btn").addEventListener("click", handleDeleteConfirm);
  document.querySelector("#delete-cancel-btn").addEventListener("click", closeDeleteDialog);
  document.querySelector("#delete-dialog").addEventListener("close", () => {
    pendingDeleteId = null;
  });
  loadProducts();
}

// ---------- Clicks inside the table ----------
// EVENT DELEGATION: instead of adding a listener to every button in every row
// (and redoing it each time the table is redrawn), we add ONE listener to the
// table body. Clicks "bubble up" from the button to it.

// ids of products whose PATCH request is still in progress
const busyIds = new Set();

// change is +1 or -1. action is "increase" or "decrease" (used to restore focus).
async function changeQuantity(product, change, action) {
  const newQuantity = Number(product.quantity) + change;

  // Rule: quantity can never be negative. The disabled button already blocks
  // this in the UI, but the logic must not depend on the UI.
  if (newQuantity < 0) {
    showMessage("Quantity can't go below 0.", "error");
    return;
  }

  // If this product already has a request in flight, ignore the click.
  // Otherwise two fast clicks would both start from the OLD quantity.
  if (busyIds.has(product.id)) return;
  busyIds.add(product.id);

  try {
    // PATCH sends ONLY the field that changed
    const updated = await patchProduct(product.id, { quantity: newQuantity });

    // Swap in the server's version, then redraw table AND summary cards
    products = products.map((item) =>
      String(item.id) === String(updated.id) ? updated : item
    );
    refreshView();
    focusRowButton(updated.id, action);
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    busyIds.delete(product.id); // always free the product, success or failure
  }
}

// ---------- Deleting ----------
// Which product the open dialog is about. null = no dialog open.
// We store the ID here instead of reading it back from the page, because
// the app's data is the truth, not the screen.
let pendingDeleteId = null;

async function handleDeleteConfirm() {
  if (pendingDeleteId === null) return;
  const id = pendingDeleteId; // copy it: the dialog's close event will reset the variable

  setDeleting(true);
  try {
    await deleteProduct(id);

    // filter keeps every product EXCEPT the deleted one
    products = products.filter((product) => String(product.id) !== String(id));
    refreshView(); // also shows the empty state if nothing is left
    showMessage("Product deleted");
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    setDeleting(false);
    closeDeleteDialog(); // closes on success AND on failure so the message is visible
    focusAddButton();
  }
}

function handleTableClick(event) {
  // closest() walks UP from what was clicked until it finds a matching element.
  // If the user clicked the text inside a button, it still finds the button.
  const button = event.target.closest("button[data-action]");
  if (!button) return; // the click was not on one of our buttons

  const row = button.closest("tr");
  const id = row.dataset.id; // the data-id we set in ui.js (a STRING)
  const action = button.dataset.action;

  // Find the product in our array that matches this row
  const product = products.find((item) => String(item.id) === id);
  if (!product) return;

  
    if (action === "edit") {
    openProductDialog(product);
  } else if (action === "increase") {
    changeQuantity(product, 1, action);
  } else if (action === "decrease") {
    changeQuantity(product, -1, action);
  } else if (action === "delete") {
    pendingDeleteId = product.id;   // remember WHICH product
    openDeleteDialog(product);      // ...then ask the user
  }
}

init();