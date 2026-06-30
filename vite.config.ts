/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Tiptap/ProseMirror need a DOM; the bridge test creates a headless editor.
    environment: "jsdom",
  },
});
