// tests/api.test.js
// Tests for api.js. We NEVER call the real server here: fetch is replaced
// by a fake, so tests are fast, repeatable and cannot touch db.json.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getProducts,
  addProduct,
  updateProduct,
  patchProduct,
  deleteProduct,
  getSampleProducts,
} from "../js/api.js";
import { API_BASE_URL, DUMMYJSON_URL } from "../js/config.js";

// The fake fetch. It is recreated before every test so one test can
// never leak into another.
let fetchMock;

// beforeEach runs before EVERY test in this file
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

// afterEach runs after every test: put the real fetch back
afterEach(() => {
  vi.unstubAllGlobals();
});

// Builds a fake server answer with just the parts our code uses:
// ok, status, statusText and json(). Defaults mean "200 OK, empty body".
function fakeResponse({ ok = true, status = 200, statusText = "OK", body = {} } = {}) {
  return { ok, status, statusText, json: async () => body };
}

const newProduct = { name: "Desk Lamp", category: "Office", price: 19.99, quantity: 10, minStock: 2, image: "" };

// ---------- Our own server: the five HTTP methods ----------
describe("getProducts (GET)", () => {
  it("asks for /products with the GET method", async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: [] }));

    await getProducts();

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/products`, { method: "GET" });
  });

  it("returns the list the server sent", async () => {
    const list = [{ id: 1, name: "Laptop Stand" }];
    fetchMock.mockResolvedValue(fakeResponse({ body: list }));

    // await: the function is async, so we wait for its result
    expect(await getProducts()).toEqual(list);
  });
});

describe("addProduct (POST)", () => {
  it("sends the product as JSON with the POST method", async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: { id: 6, ...newProduct } }));

    await addProduct(newProduct);

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/products`, {
      method: "POST",
      body: JSON.stringify(newProduct),
      headers: { "Content-Type": "application/json" },
    });
  });

  it("returns the new product WITH the id the server invented", async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: { id: 6, ...newProduct } }));

    const created = await addProduct(newProduct);

    expect(created.id).toBe(6);
  });
});

describe("updateProduct (PUT)", () => {
  it("replaces the whole record at /products/:id", async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: { id: 3, ...newProduct } }));

    await updateProduct(3, newProduct);

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/products/3`, {
      method: "PUT",
      body: JSON.stringify(newProduct),
      headers: { "Content-Type": "application/json" },
    });
  });
});

describe("patchProduct (PATCH)", () => {
  it("sends ONLY the changed fields", async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: { id: 2, quantity: 7 } }));

    await patchProduct(2, { quantity: 7 });

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/products/2`, {
      method: "PATCH",
      body: JSON.stringify({ quantity: 7 }),
      headers: { "Content-Type": "application/json" },
    });
  });
});

describe("deleteProduct (DELETE)", () => {
  it("sends DELETE with no body", async () => {
    fetchMock.mockResolvedValue(fakeResponse({ body: {} }));

    await deleteProduct(4);

    // No body means no Content-Type header either
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/products/4`, { method: "DELETE" });
  });
});

// ---------- The two kinds of failure in request() ----------
describe("error handling", () => {
  // Problem type 1: the request never reached the server.
  // The real fetch THROWS here, so our fake rejects.
  it("explains when the server cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(getProducts()).rejects.toThrow("Could not reach the server. Is it running?");
  });

  // Problem type 2: the server answered, but with an error.
  // The real fetch does NOT throw here, our code checks response.ok.
  it("explains a 404 answer", async () => {
    fetchMock.mockResolvedValue(fakeResponse({ ok: false, status: 404, statusText: "Not Found" }));

    await expect(getProducts()).rejects.toThrow("Request failed: 404 Not Found");
  });

  it("explains a 500 answer", async () => {
    fetchMock.mockResolvedValue(
      fakeResponse({ ok: false, status: 500, statusText: "Internal Server Error" })
    );

    await expect(deleteProduct(1)).rejects.toThrow("Request failed: 500 Internal Server Error");
  });

  it("applies the same error handling to every function", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(addProduct(newProduct)).rejects.toThrow("Could not reach the server");
  });
});

// ---------- The public DummyJSON API ----------
describe("getSampleProducts", () => {
  it("calls the DummyJSON address and returns the products list", async () => {
    const sample = [{ title: "Essence Mascara" }];
    fetchMock.mockResolvedValue(fakeResponse({ body: { products: sample } }));

    const result = await getSampleProducts();

    expect(fetchMock).toHaveBeenCalledWith(DUMMYJSON_URL);
    // DummyJSON wraps the list in a "products" field and we unwrap it
    expect(result).toEqual(sample);
  });

  it("explains when the sample service cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(getSampleProducts()).rejects.toThrow("Could not reach the sample products service");
  });

  it("explains an error answer from the sample service", async () => {
    fetchMock.mockResolvedValue(fakeResponse({ ok: false, status: 503 }));

    await expect(getSampleProducts()).rejects.toThrow("Sample products request failed (503).");
  });
});