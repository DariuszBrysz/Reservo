// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  env: {
    schema: {
      PUBLIC_ENV_NAME: envField.string({ context: "server", access: "secret" }),
      SUPABASE_URL: envField.string({ context: "server", access: "secret" }),
      SUPABASE_KEY: envField.string({ context: "server", access: "secret" }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare(),
});
