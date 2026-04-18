import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react(), tailwindcss()],
    build: {
      outDir: "build",
    },
    server:
      mode === "development"
        ? {
            proxy: {
              "/api": {
                target: env.VITE_API_BASE_URL || "http://localhost:4000",
                changeOrigin: true,
                secure: false,
              },
              "/uploads": {
                target: env.VITE_API_BASE_URL || "http://localhost:4000",
                changeOrigin: true,
                secure: false,
              },
            },
          }
        : undefined,
  };
});

