import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      // Cria o alias apontando para a pasta src de forma absoluta
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('katex') || id.includes('remark') || id.includes('rehype')) {
              return 'vendor-markdown';
            }
            return 'vendor';
          }
        },
      },
    },
  },
})