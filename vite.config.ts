/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss() as PluginOption],
  // `@/…` resolves to `src/…` (mirrors tsconfig paths).
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    rollupOptions: {
      // Two entries: the app, and the sandbox page that hosts the reactive
      // engine inside the iframe (so its runtime + sucrase bundle properly).
      input: {
        main: "index.html",
        sandbox: "sandbox.html",
      },
    },
  },
  test: {
    // Tiptap/ProseMirror need a DOM; the bridge test creates a headless editor.
    environment: "jsdom",
  },
});
