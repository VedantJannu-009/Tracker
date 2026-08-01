import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.GH_PAGES === 'true' ? '/Tracker/' : '/'

export default defineConfig({
  base,
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-icon.svg', 'pwa-maskable.svg'],
      manifest: {
        name: 'Gym Progress Tracker',
        short_name: 'GymTracker',
        description: 'Track your gym workouts, sets, reps, and weight progress',
        theme_color: '#0c0518',
        background_color: '#0c0518',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        icons: [
          { src: `${base}pwa-icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: `${base}pwa-192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${base}pwa-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${base}pwa-maskable.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
          { src: `${base}pwa-maskable-192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: `${base}pwa-maskable-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': import.meta.dirname + '/src',
    },
  },
})
