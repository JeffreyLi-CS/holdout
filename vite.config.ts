import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Optional HTTPS: put a trusted key/cert pair (e.g. from mkcert) in ./certs.
// Service workers and Home Screen install on iPhone need a trusted HTTPS origin.
const keyFile = new URL('./certs/key.pem', import.meta.url)
const certFile = new URL('./certs/cert.pem', import.meta.url)
const https =
  fs.existsSync(keyFile) && fs.existsSync(certFile)
    ? { key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile) }
    : undefined

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  server: { host: '127.0.0.1', https },
  preview: { host: '127.0.0.1', https },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Holdout',
        short_name: 'Holdout',
        description: 'Bank the calories you skip. Private, offline, on your device.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#000000',
        theme_color: '#16a34a',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
