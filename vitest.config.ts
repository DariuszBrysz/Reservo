import { getViteConfig } from "astro/config";
import { defineConfig } from "vitest/config";

export default getViteConfig(
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/lib/test/setup.ts",
    },
  })
);
