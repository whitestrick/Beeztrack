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
      // Start from ALL source files...
      include: ["js/**/*.js"],
      // ...then leave out the two DOM files. They touch `document` as soon
      // as they are imported, so they cannot run in plain Node. They are
      // checked by hand with the test table of every issue (and the README
      // says so). This means the percentage measures our LOGIC layer.
      exclude: ["js/app.js", "js/ui.js"],
      reporter: ["text", "html"],
      // Fail `npm run coverage` if a number drops below 50%.
      // 
      thresholds: {
        lines: 50,
        statements: 50,
        functions: 50,
        branches: 50,
      },
    },
  },
});