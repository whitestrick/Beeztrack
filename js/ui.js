import { getStockStatus } from "./inventory.js";

// the DOM lives in this file.

// - Find the elements before to inc speed -
// Looking elements up is slow-ish, so iprefer to do it once at the top
// and reuse the variables.
const loadingState = document.querySelector("#loading-state");
const errorState = document.querySelector("#error-state");
const errorMessage = document.querySelector("#error-message");
const emptyState = document.querySelector("#empty-state");
const tableWrapper = document.querySelector("#table-wrapper");
const tableBody = document.querySelector("#product-table-body");
// card selectors rendered early like the elements above
const totalProductsEl = document.querySelector("#total-products");
const inventoryValueEl = document.querySelector("#inventory-value");
const lowStockCountEl = document.querySelector("#low-stock-count");
const outStockCountEl = document.querySelector("#out-stock-count");

const messageArea = document.querySelector("#message-area");

const productDialog = document.querySelector("#product-dialog");
const productForm = document.querySelector("#product-form");
const productDialogTitle = document.querySelector("#product-dialog-title");
const productIdInput = document.querySelector("#product-id");
const productSaveBtn = document.querySelector("#product-save-btn");
const categoryList = document.querySelector("#category-list");

// Links each field name from validation.js to its input and its error <p>.
// The ORDER here is the order the form is read and focused in.
const FORM_FIELDS = {
  name: { input: "#product-name", error: "#name-error" },
  category: { input: "#product-category", error: "#category-error" },
  price: { input: "#product-price", error: "#price-error" },
  quantity: { input: "#product-quantity", error: "#quantity-error" },
  minStock: { input: "#product-min-stock", error: "#min-stock-error" },
  image: { input: "#product-image", error: "#image-error" },
};

// The logic (inventory.js) decides the status;
// this table decides the label and CSS classes used to display it.
const STATUS_DISPLAY = {
  ok: { label: "OK", rowClass: "", badgeClass: "badge-ok" },
  low: { label: "Low", rowClass: "row-low", badgeClass: "badge-low" },
  out: { label: "Out", rowClass: "row-out", badgeClass: "badge-out" },
};

// ---------- Showing one area at a time ----------
// Only ONE of the four areas (loading / error / empty / table) is visible.
// For each area, "hidden" becomes true unless it is the one we want.
function showOnly(areaToShow) {
  const allAreas = [loadingState, errorState, emptyState, tableWrapper];
  allAreas.forEach((area) => {
    area.hidden = area !== areaToShow;
  });
}

export function showLoading() {
  showOnly(loadingState);
}

export function showError(message) {
  errorMessage.textContent = `We couldn't load your products. ${message}`;
  showOnly(errorState);
}

export function showEmpty() {
  showOnly(emptyState);
}
// --Feedback messages --
// The id of the "hide it later" timer. It lives OUTSIDE the function so the
// next call can find it and cancel it. Otherwise an old timer could remove
// a NEW message too early.
let messageTimer = null;

// type is "success" or "error". Success vanishes after 4 seconds, errors
// stay 6 seconds because they usually need more reading time.


export function showMessage(text, type = "success") {
  // Only two types exist in our CSS, so anything else becomes an error
  const safeType = type === "success" ? "success" : "error";

  // Cancel the previous message's timer, if there is one
  clearTimeout(messageTimer);

  // Build <p class="message message-success">text</p>.
  // createElement uses textContent, so the text can never inject HTML.
  const message = createElement("p", `message message-${safeType}`, text);

  // replaceChildren: the new message REPLACES the old one,
  // so messages never pile up.
  messageArea.replaceChildren(message);

  const duration = safeType === "success" ? 4000 : 6000;
  messageTimer = setTimeout(() => {
    messageArea.replaceChildren(); // no arguments = empty the area
  }, duration);
}

// - product dialog -

// Reads every field and returns the RAW strings the user typed.
// Cleaning and converting happens in app.js, checking happens in validation.js.
export function readProductForm() {
  const values = {};
  for (const [field, selectors] of Object.entries(FORM_FIELDS)) {
    values[field] = document.querySelector(selectors.input).value;
  }
  return values;
}

// Removes every error message and red border
export function clearFieldErrors() {
  for (const selectors of Object.values(FORM_FIELDS)) {
    const input = document.querySelector(selectors.input);
    input.classList.remove("input-invalid");
    input.removeAttribute("aria-invalid");
    document.querySelector(selectors.error).textContent = "";
  }
}

// errors looks like { price: "Price is required." }  (from validation.js)
export function showFieldErrors(errors) {
  let firstInvalidInput = null;

  for (const [field, selectors] of Object.entries(FORM_FIELDS)) {
    if (!errors[field]) continue; // this field is fine, skip it

    const input = document.querySelector(selectors.input);
    input.classList.add("input-invalid");
    input.setAttribute("aria-invalid", "true");
    document.querySelector(selectors.error).textContent = errors[field];

    if (!firstInvalidInput) firstInvalidInput = input;
  }

  // Put the cursor in the first bad field so the user can fix it right away
  if (firstInvalidInput) firstInvalidInput.focus();
}

// product is OPTIONAL.
//   openProductDialog()          -> empty form, "Add Product"
//   openProductDialog(someProduct) -> filled form, "Edit Product"
export function openProductDialog(product) {
  productForm.reset();
  clearFieldErrors();

  if (product) {
    // EDIT mode: put the product's values into the inputs
    productIdInput.value = product.id;
    productDialogTitle.textContent = "Edit Product";

    for (const field of Object.keys(FORM_FIELDS)) {
      // ?? "" means: if the value is missing, use an empty string
      document.querySelector(FORM_FIELDS[field].input).value = product[field] ?? "";
    }
  } else {
    // ADD mode
    productIdInput.value = "";
    productDialogTitle.textContent = "Add Product";
  }

  productDialog.showModal();
}

export function closeProductDialog() {
  productDialog.close();
}

// Disables the Save button while we wait for the server
export function setSaving(isSaving) {
  productSaveBtn.disabled = isSaving;
  productSaveBtn.textContent = isSaving ? "Saving..." : "Save Product";
}

// Fills the category suggestions with the categories that already exist
export function updateCategoryList(products) {
  const categories = [...new Set(products.map((product) => product.category))].sort();

  const options = categories.map((category) => {
    const option = document.createElement("option");
    option.value = category;
    return option;
  });

  categoryList.replaceChildren(...options);
}

// Makes an element, optionally with a class and some text.
// textContent treats the text as PLAIN TEXT, never as HTML.for security If someone
// names a product "<script>...</script>" it just shows as words.


function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

// Makes a <td> which holding either plain text or an element built
function createCell(content) {
  const cell = document.createElement("td");
  if (content instanceof Node) {
    cell.appendChild(content);
  } else {
    cell.textContent = content;
  }
  return cell;
}

function formatPrice(price) {
  // toLocaleString adds separators and keeps exactly 2 decimals by converting my no into a string
  return `$${Number(price).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// -cell by cell-

function createImageCell(product) {
  if (product.image) {
    const img = createElement("img", "thumb");
    img.src = product.image;
    img.alt = product.name;
    return createCell(img);
  }
  // No image URL: show the grey placeholder box from CSS
  const placeholder = createElement("span", "thumb thumb-placeholder", "X");
  placeholder.setAttribute("aria-hidden", "true");
  return createCell(placeholder);
}

function createQuantityCell(product) {
  const wrapper = createElement("div", "qty-control");

  const minus = createElement("button", "btn-qty", "\u2212"); // the minus sign
  minus.type = "button";
  minus.dataset.action = "decrease";
  minus.setAttribute("aria-label", `Decrease quantity of ${product.name}`);

  const value = createElement("span", "qty-value", product.quantity);

  const plus = createElement("button", "btn-qty", "+");
  plus.type = "button";
  plus.dataset.action = "increase";
  plus.setAttribute("aria-label", `Increase quantity of ${product.name}`);

  wrapper.append(minus, value, plus);
  return createCell(wrapper);
}

function createStatusCell(status) {
  const display = STATUS_DISPLAY[status];
  const badge = createElement("span", `badge ${display.badgeClass}`, display.label);
  return createCell(badge);
}

function createActionsCell(product) {
  const wrapper = createElement("div", "row-actions");

  const edit = createElement("button", "btn btn-small btn-outline", "Edit");
  edit.type = "button";
  edit.dataset.action = "edit";
  edit.setAttribute("aria-label", `Edit ${product.name}`);

  const remove = createElement("button", "btn btn-small btn-danger-outline", "Delete");
  remove.type = "button";
  remove.dataset.action = "delete";
  remove.setAttribute("aria-label", `Delete ${product.name}`);

  wrapper.append(edit, remove);
  return createCell(wrapper);
}

// -row -
function createProductRow(product) {
  const row = document.createElement("tr");

  // data-id stores the product's id on the row.(edit, delete,
  // quantity buttons) read it to know WHICH product was clicked.
  row.dataset.id = product.id;

  // Ask inventory.js for the status, then add the matching row class.
  // "ok" rows get no class at all, so classList.add is skipped for them.
  const status = getStockStatus(product);
  const { rowClass } = STATUS_DISPLAY[status];
  if (rowClass) row.classList.add(rowClass);

  row.append(
    createImageCell(product),
    createCell(product.name),
    createCell(product.category),
    createCell(formatPrice(product.price)),
    createQuantityCell(product),
    createCell(product.minStock),
    createStatusCell(status), // replaces the dash placeholder from #7
    createActionsCell(product)
  );

  return row;
}

// ---------- The main function: draws my full table ----------
export function renderProducts(products) {
  const rows = products.map(createProductRow);

  // replaceChildren() removes the old rows and puts the new ones in, at once
  tableBody.replaceChildren(...rows);

  showOnly(tableWrapper);
}

// Fills in the four cards. It receives the numbers, it does not calculate them.
export function renderSummary(summary) {
  totalProductsEl.textContent = summary.totalProducts;
  inventoryValueEl.textContent = formatPrice(summary.totalValue);
  lowStockCountEl.textContent = summary.lowCount;
  outStockCountEl.textContent = summary.outCount;
}

// Returns the id of the product being edited, or "" when adding
export function readProductId() {
  return productIdInput.value;
}