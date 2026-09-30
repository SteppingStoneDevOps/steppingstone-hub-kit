import { defineConfig } from "vitest/config";

// Node by default (the rule modules are pure); component tests opt into jsdom per file with
// `// @vitest-environment jsdom` at the top.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
