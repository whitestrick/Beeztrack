// api.js
// All communication with the server lives in this file.
// No other file  calls fetch() on our backend. Components ask this
// module for data and never worry about URLs or headers.

import { API_BASE_URL, DUMMYJSON_URL } from "./config.js";

// Every API function below goes through request(), so fetching,
// converting to JSON and error handling are written only ONCE.
// "async" used for function that do slow work (network) and returns a Promise.
async function request(path, options = {}) {
  // Start with GET unless the caller says otherwise
  const fetchOptions = { method: "GET", ...options };

  // If we are sending data (POST, PUT, PATCH), tell the server it is JSON
  if (options.body) {
    fetchOptions.headers = { "Content-Type": "application/json" };
  }

  let response;

  // Problem type 1: the request never reached the server
  // (server stopped, no internet). fetch() itself throws in that case.
  try {
    response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);
  } catch (error) {
    throw new Error("Could not reach the server. Is it running?");
  }

  // Problem type 2: the server answered, but with an error (404, 500...).
  // fetch() does NOT throw for these, so we must check response.ok ourselves.
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  // Convert the response body from JSON text into a JavaScript object/array
  return response.json();
}

// ---------- The public functions ----------

// GET /products  ->  an array of all products
export function getProducts() {
  return request("/products");
}

// POST /products  ->  creates a product and returns it WITH its new id.
// The server (json-server) is the one that invents the id, so we never have to
// make one up ourselves.
export function addProduct(product) {
  return request("/products", {
    method: "POST",
    body: JSON.stringify(product), // JS object -> JSON text for the request body
  });
}

// PUT /products/:id  ->  REPLACES the whole record.
// Any field you leave out is DELETED (tested using curlin issue#3).
// That is why the edit form always sends every field.
export function updateProduct(id, product) {
  return request(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

// PATCH /products/:id  ->  changes ONLY the fields you send.
// Everything else in the record stays exactly as it was.
// PUT,above , however replaces the whole record.
export function patchProduct(id, changes) {
  return request(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

// DELETE /products/:id  ->  removes the record from db.json.
// There is no body to send. json-server replies with an empty object {},
// so request()'s response.json() still works.
export function deleteProduct(id) {
  return request(`/products/${id}`, { method: "DELETE" });
}

// Gets the sample products from the PUBLIC DummyJSON API (not our json-server).
// We use fetch directly here because our internal request() function adds
// API_BASE_URL in front of the path, and this is a different website.
export async function getSampleProducts() {
  let response;
  try {
    response = await fetch(DUMMYJSON_URL);
  } catch (error) {
    // fetch only throws when the request never got an answer (offline, blocked)
    throw new Error("Could not reach the sample products service. Check your internet connection.");
  }

  // fetch does NOT throw on 404 or 500, so we check response.ok ourselves
  if (!response.ok) {
    throw new Error(`Sample products request failed (${response.status}).`);
  }

  const data = await response.json();
  return data.products; // DummyJSON wraps the list inside a "products" field
}