import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.{test,spec}.{ts,js}"],
    environment: "node",
    coverage: {
      include: ["src/**"],
    },
  },
});
