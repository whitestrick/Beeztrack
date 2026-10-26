// tests/validation.test.js
// Unit tests for validation.js. validateProduct receives the RAW strings
// from the form and returns an object with only the fields that have a problem.
import { describe, it, expect } from "vitest";
import { validateProduct, isValid } from "../js/validation.js";

// One fully valid product. In each test we copy it and break ONE field,
// so we know exactly which rule caused the error.
// { ...validProduct, price: "0" } means "same as validProduct, but price is "0"".
const validProduct = {
  name: "Desk Lamp",
  category: "Office",
  price: "19.99",
  quantity: "10",
  minStock: "2",
  image: "",
};

// ---------- The happy path ----------
describe("validateProduct: valid data", () => {
  it("returns no errors for a valid product", () => {
    expect(validateProduct(validProduct)).toEqual({});
  });

  it("also works when the values are real numbers, not text", () => {
    const errors = validateProduct({ ...validProduct, price: 19.99, quantity: 10, minStock: 2 });
    expect(errors).toEqual({});
  });
});

// ---------- Name ----------
describe("validateProduct: name", () => {
  it("requires a name", () => {
    expect(validateProduct({ ...validProduct, name: "" }).name).toBe("Product name is required.");
  });

  it("treats a name made only of spaces as empty", () => {
    expect(validateProduct({ ...validProduct, name: "     " }).name).toBe("Product name is required.");
  });

  // BOUNDARY: 60 characters is the longest allowed name
  it("accepts a name of exactly 60 characters", () => {
    const errors = validateProduct({ ...validProduct, name: "a".repeat(60) });
    expect(errors.name).toBeUndefined();
  });

  // BOUNDARY: 61 is the first name that is too long
  it("rejects a name of 61 characters", () => {
    const errors = validateProduct({ ...validProduct, name: "a".repeat(61) });
    expect(errors.name).toBe("Product name must be 60 characters or fewer.");
  });

  it("does not count spaces around the name", () => {
    const errors = validateProduct({ ...validProduct, name: "  " + "a".repeat(60) + "  " });
    expect(errors.name).toBeUndefined();
  });
});

// ---------- Category ----------
describe("validateProduct: category", () => {
  it("requires a category", () => {
    expect(validateProduct({ ...validProduct, category: "" }).category).toBe("Category is required.");
  });
});

// ---------- Price ----------
describe("validateProduct: price", () => {
  it("requires a price", () => {
    expect(validateProduct({ ...validProduct, price: "" }).price).toBe("Price is required.");
  });

  // The trap from validation.js: Number("") is 0. Because isBlank is checked
  // first, an empty price says "required", NOT "must be greater than 0".
  it("says 'required' (not 'greater than 0') for an empty price", () => {
    expect(validateProduct({ ...validProduct, price: "" }).price).not.toContain("greater than 0");
  });

  // it.each runs the SAME test once for each row. [value] is one row.
  // %s in the title is replaced by the value, so each run has its own name.
  it.each([["abc"], ["0"], ["-5"], ["Infinity"]])(
    "rejects the price %s",
    (badPrice) => {
      const errors = validateProduct({ ...validProduct, price: badPrice });
      expect(errors.price).toBe("Price must be a number greater than 0.");
    }
  );

  // BOUNDARY: the smallest positive price is fine, 0 is not
  it.each([["0.01"], ["1"], ["8.50"]])("accepts the price %s", (goodPrice) => {
    expect(validateProduct({ ...validProduct, price: goodPrice }).price).toBeUndefined();
  });
});

// ---------- Quantity and min stock (same rules, different labels) ----------
describe("validateProduct: quantity", () => {
  it("requires a quantity", () => {
    expect(validateProduct({ ...validProduct, quantity: "" }).quantity).toBe("Quantity is required.");
  });

  it.each([["abc"], ["2.5"], ["-1"]])("rejects the quantity %s", (badQuantity) => {
    const errors = validateProduct({ ...validProduct, quantity: badQuantity });
    expect(errors.quantity).toBe("Quantity must be a whole number (0 or more).");
  });

  // BOUNDARY: 0 is allowed (the product is simply out of stock)
  it("accepts a quantity of 0", () => {
    expect(validateProduct({ ...validProduct, quantity: "0" }).quantity).toBeUndefined();
  });
});

describe("validateProduct: minStock", () => {
  it("requires a min stock", () => {
    expect(validateProduct({ ...validProduct, minStock: "" }).minStock).toBe("Min stock is required.");
  });

  it.each([["abc"], ["1.5"], ["-3"]])("rejects the min stock %s", (badMin) => {
    const errors = validateProduct({ ...validProduct, minStock: badMin });
    expect(errors.minStock).toBe("Min stock must be a whole number (0 or more).");
  });

  it("accepts a min stock of 0", () => {
    expect(validateProduct({ ...validProduct, minStock: "0" }).minStock).toBeUndefined();
  });
});

// ---------- Image (optional) ----------
describe("validateProduct: image", () => {
  it("allows an empty image", () => {
    expect(validateProduct({ ...validProduct, image: "" }).image).toBeUndefined();
  });

  it("allows an image made only of spaces (treated as empty)", () => {
    expect(validateProduct({ ...validProduct, image: "   " }).image).toBeUndefined();
  });

  it("accepts http and https addresses", () => {
    expect(validateProduct({ ...validProduct, image: "https://example.com/lamp.png" }).image).toBeUndefined();
    expect(validateProduct({ ...validProduct, image: "http://example.com/lamp.png" }).image).toBeUndefined();
  });

  it("ignores spaces around a valid address", () => {
    const errors = validateProduct({ ...validProduct, image: "  https://example.com/lamp.png  " });
    expect(errors.image).toBeUndefined();
  });

  // The first two are real URLs that are not web addresses; javascript: is
  // the dangerous one, so it is good that the protocol check blocks it.
  // The last two are not URLs at all, so new URL() throws (the catch branch).
  it.each([
    ["ftp://example.com/lamp.png"],
    ["javascript:alert(1)"],
    ["not a url"],
    ["example.com/lamp.png"],
  ])("rejects the image %s", (badImage) => {
    const errors = validateProduct({ ...validProduct, image: badImage });
    expect(errors.image).toBe("Image must be a web address starting with http:// or https://");
  });
});

// ---------- Several problems at once ----------
describe("validateProduct: combined", () => {
  it("reports every wrong field, and only those", () => {
    const errors = validateProduct({ ...validProduct, name: "", price: "0", quantity: "-1" });
    expect(Object.keys(errors).sort()).toEqual(["name", "price", "quantity"]);
  });

  it("reports every required field for an empty form", () => {
    expect(validateProduct({})).toEqual({
      name: "Product name is required.",
      category: "Category is required.",
      price: "Price is required.",
      quantity: "Quantity is required.",
      minStock: "Min stock is required.",
    });
  });
});

// ---------- isValid ----------
describe("isValid", () => {
  it("is true when there are no errors", () => {
    expect(isValid({})).toBe(true);
  });

  it("is false when there is at least one error", () => {
    expect(isValid({ price: "Price is required." })).toBe(false);
  });

  it("works together with validateProduct", () => {
    expect(isValid(validateProduct(validProduct))).toBe(true);
    expect(isValid(validateProduct({ ...validProduct, name: "" }))).toBe(false);
  });
});