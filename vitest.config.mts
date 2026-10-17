import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside the Next.js bundler; stub it in tests.
      "server-only": fileURLToPath(
        new URL("./tests/unit/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    passWithNoTests: true,
  },
});
