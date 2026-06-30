/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
