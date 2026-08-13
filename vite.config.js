import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    port: 5173,
    host: "127.0.0.1",
    hmr: {
      host: "127.0.0.1",
      port: 5173,
      protocol: "http"
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true
      }
    },
    watch: {
      ignored: ["**/reference/**"],
      usePolling: true
    }
  }
});