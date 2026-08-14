// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // FTP hosting only serves files, so omit the Cloudflare/Nitro server bundle.
  nitro: false,
  vite: {
    build: {
      outDir: ".tanstack-build",
      rolldownOptions: {
        output: {
          // Recharts is only used by the Performance route; keep it out of the
          // shared route bundle and load it only when that page is visited.
          manualChunks: (id) => (id.includes("/node_modules/recharts/") ? "charts" : undefined),
        },
      },
    },
    server: {
      host: true,
      port: 8080,
      strictPort: false,
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Generate static HTML for each discoverable route so the site can be hosted via FTP.
    prerender: {
      enabled: true,
      crawlLinks: true,
      failOnError: true,
    },
  },
});
