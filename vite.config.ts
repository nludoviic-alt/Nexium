import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
      pages: [{ path: "/composition" }, { path: "/reset-password" }, { path: "/recouvrement" }],
      prerender: {
        enabled: true,
        crawlLinks: true,
        failOnError: true,
      },
    }),
    viteReact(),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  build: {
    outDir: ".tanstack-build",
    rolldownOptions: {
      output: {
        manualChunks: (id) => (id.includes("/node_modules/recharts/") ? "charts" : undefined),
      },
    },
  },
  server: {
    host: true,
    port: 8080,
    strictPort: false,
    allowedHosts: true,
    proxy: {
      "/api/admin": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
