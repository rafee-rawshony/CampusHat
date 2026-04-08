import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'CampusHat', short_name: 'CampusHat',
        description: 'Bangladesh campus marketplace',
        theme_color: '#634C9F', background_color: '#FFFFFF',
        display: 'standalone', start_url: '/',
        icons: [
          {src:'/icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'maskable'},
          {src:'/icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'},
        ],
      },
      workbox: {
        runtimeCaching: [
          { urlPattern:/\/api\/v1\/(universities|mall\/categories)/,
            handler:'CacheFirst',
            options:{cacheName:'static-api',expiration:{maxAgeSeconds:86400}} },
          { urlPattern:/\/api\/v1\/mall\/products/,
            handler:'StaleWhileRevalidate',
            options:{cacheName:'products',expiration:{maxEntries:100,maxAgeSeconds:300}} },
        ],
      },
    }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 3000,
    proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: true } },
  },
})
