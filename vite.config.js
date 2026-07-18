import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  // IMPORTANT (GitHub Pages):
  // This app is deployed to a *project* page at https://<user>.github.io/vbs-web/
  // so all built asset URLs must be prefixed with the repository name.
  // If you deploy to a custom domain or a <user>.github.io root repo, change this to "/".
  base: "/vbs-web/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["pwa-icon.svg", "vite.svg"],
      manifest: {
        name: "출석부 · 여름성경학교",
        short_name: "출석부",
        description: "여름성경학교 출석 관리",
        theme_color: "#4f46e5",
        background_color: "#f6f5f3",
        display: "standalone",
        orientation: "portrait",
        lang: "ko",
        icons: [
          {
            src: "pwa-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "pwa-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // SPA fallback — keep teachers on the app shell when offline after first load.
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
    }),
  ],
  server: {
    // Bind to 0.0.0.0 so the dev server is reachable from outside the Docker container.
    host: true,
    port: 5173,
    // Enable polling so file-change events propagate correctly through a mounted Docker volume (HMR).
    watch: {
      usePolling: true,
    },
  },
});
