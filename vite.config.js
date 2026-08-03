import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    port: 5176,
    host: "localhost",
    hmr: {
      host: "localhost",
      port: 5176,
      protocol: "http"
    },
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true
      }
    },
    watch: {
      ignored: ["**/reference/**"],
      usePolling: true
    }
  }
});