/**
 * Vitest configuration.
 * Node environment is enough because routes are tested as Request handlers.
 */
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    // Route tests exercise the logging wrapper; keep the suite off disk unless
    // a test opts in with vi.stubEnv("LOG_TO_FILE", "true").
    env: {
      LOG_TO_FILE: "false",
      LOG_CONSOLE: "false",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
