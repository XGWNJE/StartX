import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    // Output to dist folder
    outDir: 'dist',
    emptyOutDir: true,
    // Generate sourcemaps for better debugging
    sourcemap: true,
    // Copy manifest.json and icons to dist folder
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code into separate chunks
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },
})
