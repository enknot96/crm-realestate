import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    // e2e/配下はPlaywright用のテストなのでVitestの対象から外す
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
