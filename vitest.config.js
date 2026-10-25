// vitest.config.js
// Tells Vitest where our tests are and what coverage should measure.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // "node" = tests run in plain Node, no browser.
    // Perfect for our logic modules (inventory, validation, api).
    environment: "node",

    // Only look for tests inside the tests/ folder
    include: ["tests/**/*.test.js"],

    coverage: {
      provider: "v8",
      // Measure ALL our source files, even ones no test touches yet.
      // Without this, untested files would be invisible and the
      // percentage would look better than it really is.
      include: ["js/**/*.js"],
      // text = table in the terminal, html = a page we can open and screenshot
      reporter: ["text", "html"],
    },
  },
});