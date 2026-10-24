
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


// Makes an element, optionally with a class and some text.
// textContent treats the text as PLAIN TEXT, never as HTML. If someone
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
  return `$${Number(price).toFixed(2)}`;
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

  // data-id stores the product's id on the row.the  (edit, delete,
  // quantity buttons) read it to know WHICH product was clicked.
  row.dataset.id = product.id;

  row.append(
    createImageCell(product),
    createCell(product.name),
    createCell(product.category),
    createCell(formatPrice(product.price)),
    createQuantityCell(product),
    createCell(product.minStock),
    createCell("\u2014"), // a dash for now. ***remember to sortout
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