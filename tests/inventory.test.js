// tests/inventory.test.js
// Unit tests for inventory.js. can be done directly without the browser
import { describe, it, expect } from "vitest";
import {
  getStockStatus,
  calculateSummary,
  filterProducts,
  getCategories,
  mapSampleProduct,
  findNewProducts,
  DEFAULT_MIN_STOCK,
} from "../js/inventory.js";

// The same five products as our db.json baseline.
// Tests never change this list, so every test can safely share it.
const products = [
  { id: 1, name: "Bluetooth Speaker", category: "Electronics", price: 45, quantity: 40, minStock: 5 },
  { id: 2, name: "USB-C Cable", category: "Accessories", price: 12, quantity: 3, minStock: 5 },
  { id: 3, name: "Wireless Mouse", category: "Accessories", price: 25, quantity: 0, minStock: 3 },
  { id: 4, name: "Laptop Stand", category: "Office", price: 35, quantity: 15, minStock: 5 },
  { id: 5, name: "Notebook Pack", category: "Office", price: 8.5, quantity: 5, minStock: 5 },
];

// Small helper: turns a list of products into a list of names,
// so test results are easy to read: ["USB-C Cable", "Notebook Pack"]
const names = (list) => list.map((product) => product.name);

// ---------- getStockStatus ----------
describe("getStockStatus", () => {
  it("returns 'out' when quantity is 0", () => {
    expect(getStockStatus({ quantity: 0, minStock: 5 })).toBe("out");
  });

  it("returns 'out' when quantity is negative", () => {
    expect(getStockStatus({ quantity: -2, minStock: 5 })).toBe("out");
  });

  it("returns 'low' when quantity is below minStock", () => {
    expect(getStockStatus({ quantity: 3, minStock: 5 })).toBe("low");
  });

  // BOUNDARY: exactly equal to minStock counts as low (the rule is <=)
  it("returns 'low' when quantity equals minStock", () => {
    expect(getStockStatus({ quantity: 5, minStock: 5 })).toBe("low");
  });

  // BOUNDARY: one more than minStock is the first "ok" value
  it("returns 'ok' when quantity is just above minStock", () => {
    expect(getStockStatus({ quantity: 6, minStock: 5 })).toBe("ok");
  });

  // out must be checked BEFORE low. With minStock 0, quantity 0 would also
  // satisfy "quantity <= minStock", so a wrong order would say "low".
  it("checks 'out' before 'low'", () => {
    expect(getStockStatus({ quantity: 0, minStock: 0 })).toBe("out");
  });

  it("accepts numbers that arrive as text", () => {
    expect(getStockStatus({ quantity: "3", minStock: "5" })).toBe("low");
  });
});

// ---------- calculateSummary ----------
describe("calculateSummary", () => {
  it("calculates the four card numbers for the baseline products", () => {
    const summary = calculateSummary(products);

    expect(summary.totalProducts).toBe(5);
    // toBeCloseTo, not toBe: money with decimals can have tiny floating point
    // errors in JavaScript (0.1 + 0.2 is 0.30000000000000004)
    expect(summary.totalValue).toBeCloseTo(2403.5, 2);
    expect(summary.lowCount).toBe(2);
    expect(summary.outCount).toBe(1);
  });

  it("returns zeros for an empty list", () => {
    expect(calculateSummary([])).toEqual({
      totalProducts: 0,
      totalValue: 0,
      lowCount: 0,
      outCount: 0,
    });
  });
});

// ---------- filterProducts ----------
describe("filterProducts", () => {
  const noFilters = { search: "", category: "", status: "" };

  it("returns every product when no filter is active", () => {
    const result = filterProducts(products, noFilters);
    expect(result).toEqual(products);
    // toBe checks it is the SAME array object. We promised a NEW array.
    expect(result).not.toBe(products);
  });

  it("treats missing filter fields like empty ones", () => {
    expect(filterProducts(products, {})).toHaveLength(5);
  });

  it("searches by part of the name", () => {
    const result = filterProducts(products, { ...noFilters, search: "usb" });
    expect(names(result)).toEqual(["USB-C Cable"]);
  });

  it("ignores upper and lower case in the search", () => {
    const result = filterProducts(products, { ...noFilters, search: "CABLE" });
    expect(names(result)).toEqual(["USB-C Cable"]);
  });

  it("ignores spaces around the search text", () => {
    const result = filterProducts(products, { ...noFilters, search: "  cable  " });
    expect(names(result)).toEqual(["USB-C Cable"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterProducts(products, { ...noFilters, search: "zzz" })).toEqual([]);
  });

  it("filters by category", () => {
    const result = filterProducts(products, { ...noFilters, category: "Office" });
    expect(names(result)).toEqual(["Laptop Stand", "Notebook Pack"]);
  });

  // Known limit we mentioned in #18: categories are compared exactly
  it("compares categories exactly (case matters)", () => {
    expect(filterProducts(products, { ...noFilters, category: "office" })).toEqual([]);
  });

  it("filters by status 'low'", () => {
    const result = filterProducts(products, { ...noFilters, status: "low" });
    expect(names(result)).toEqual(["USB-C Cable", "Notebook Pack"]);
  });

  it("filters by status 'out'", () => {
    const result = filterProducts(products, { ...noFilters, status: "out" });
    expect(names(result)).toEqual(["Wireless Mouse"]);
  });

  it("filters by status 'ok'", () => {
    const result = filterProducts(products, { ...noFilters, status: "ok" });
    expect(names(result)).toEqual(["Bluetooth Speaker", "Laptop Stand"]);
  });

  // All three filters must pass at the same time (AND, not OR)
  it("combines search, category and status", () => {
    const result = filterProducts(products, { search: "note", category: "Office", status: "low" });
    expect(names(result)).toEqual(["Notebook Pack"]);
  });

  it("returns nothing when the filters contradict each other", () => {
    const result = filterProducts(products, { search: "", category: "Office", status: "out" });
    expect(result).toEqual([]);
  });

  it("does not change the original list", () => {
    filterProducts(products, { ...noFilters, status: "low" });
    expect(products).toHaveLength(5);
  });
});

// ---------- getCategories ----------
describe("getCategories", () => {
  it("returns each category once, sorted A to Z", () => {
    expect(getCategories(products)).toEqual(["Accessories", "Electronics", "Office"]);
  });

  it("returns an empty list when there are no products", () => {
    expect(getCategories([])).toEqual([]);
  });
});

// ---------- mapSampleProduct ----------
describe("mapSampleProduct", () => {
  it("converts a DummyJSON product to a Beeztrack product", () => {
    const sample = {
      title: "  Essence Mascara  ",
      category: "beauty",
      price: 9.99,
      stock: 5,
      thumbnail: "https://example.com/mascara.png",
    };

    expect(mapSampleProduct(sample)).toEqual({
      name: "Essence Mascara",          // trimmed
      category: "Beauty",               // first letter capitalized
      price: 9.99,
      quantity: 5,                      // stock -> quantity
      minStock: DEFAULT_MIN_STOCK,      // DummyJSON has no minStock
      image: "https://example.com/mascara.png", // thumbnail -> image
    });
  });

  it("turns hyphens in the category into spaces", () => {
    const result = mapSampleProduct({ title: "Lamp", category: "home-decoration" });
    expect(result.category).toBe("Home decoration");
  });

  it("uses safe defaults when values are missing", () => {
    const result = mapSampleProduct({ title: "Mystery", category: "misc" });
    expect(result.price).toBe(0);
    expect(result.quantity).toBe(0);
    expect(result.image).toBe("");
  });

  it("gives every imported product the default minimum stock", () => {
    expect(DEFAULT_MIN_STOCK).toBe(5);
    expect(mapSampleProduct({ title: "A", category: "b" }).minStock).toBe(5);
  });
});

// ---------- findNewProducts ----------
describe("findNewProducts", () => {
  it("returns every candidate when the inventory is empty", () => {
    const candidates = [{ name: "Lamp" }, { name: "Desk" }];
    expect(names(findNewProducts(candidates, []))).toEqual(["Lamp", "Desk"]);
  });

  it("skips candidates whose name already exists, ignoring case", () => {
    const candidates = [{ name: "WIRELESS MOUSE" }, { name: "Desk Lamp" }];
    expect(names(findNewProducts(candidates, products))).toEqual(["Desk Lamp"]);
  });

  it("removes duplicates inside the candidates list itself", () => {
    const candidates = [{ name: "Lamp" }, { name: "lamp" }];
    // the FIRST one is kept
    expect(names(findNewProducts(candidates, []))).toEqual(["Lamp"]);
  });

  it("returns an empty list when everything already exists", () => {
    const candidates = [{ name: "Laptop Stand" }];
    expect(findNewProducts(candidates, products)).toEqual([]);
  });
});