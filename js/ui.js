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
  // toLocaleString adds separators and keeps exactly 2 decimals
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