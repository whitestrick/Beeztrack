// tests/smoke.test.js
// A tiny first test. Its only job is to prove Vitest is installed and
// can import our real code. The real tests come in #22 and #23.
import { describe, it, expect } from "vitest";
import { getStockStatus } from "../js/inventory.js";

// describe() groups related tests under one name
describe("getStockStatus (setup check)", () => {
  // it() is ONE test: a sentence that says what should happen
  it("returns 'out' when quantity is 0", () => {
    const product = { quantity: 0, minStock: 5 };

    // expect(actual).toBe(expected): the test fails if they differ
    expect(getStockStatus(product)).toBe("out");
  });
});