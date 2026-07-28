import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", globals: true },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Next aliases `server-only` to an empty module at build; do the same so
      // server-only modules can be imported directly in unit tests.
      "server-only": path.resolve(__dirname, "test/empty-module.ts"),
    },
  },
});
