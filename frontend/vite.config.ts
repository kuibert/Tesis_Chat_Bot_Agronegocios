import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";

import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-180x180.png"],
      manifest: {
        name: "AgroBot - Asistente de Fertilización",
        short_name: "AgroBot",
        description:
          "Asistente inteligente de fertilización agrícola con IA para El Salvador",
        theme_color: "#16a34a",
        background_color: "#1A1D21",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Cachear los recursos estáticos de la app
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // NO intentar cachear las llamadas a la API ni WebSockets
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            // Cachear las fuentes de Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          auth: ["@azure/msal-react", "@azure/msal-browser", "@react-oauth/google"],
          query: ["@tanstack/react-query"],
          socket: ["socket.io-client"],
        },
      },
    },
  },
  server: {
    allowedHosts: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
      "/socket.io": { target: "http://localhost:3000", ws: true, changeOrigin: true },
    },
  },
});
