import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  // IMPORTANT (GitHub Pages):
  // This app is deployed to a *project* page at https://<user>.github.io/vbs-web/
  // so all built asset URLs must be prefixed with the repository name.
  // If you deploy to a custom domain or a <user>.github.io root repo, change this to "/".
  base: "/vbs-web/",
  plugins: [react(), tailwindcss()],
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
