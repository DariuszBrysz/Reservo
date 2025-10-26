import { getViteConfig } from "astro/config";
import { defineConfig } from "vitest/config";
import { configDefaults } from "vitest/config";

export default getViteConfig(
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/lib/test/setup.ts",
      exclude: [...configDefaults.exclude, "**/e2e/**"],
    },
  })
);
