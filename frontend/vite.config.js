import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    // Code-split large vendor libraries so the initial bundle is smaller
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
        },
      },
    },
    // Warn when a chunk exceeds 600 kB (default is 500 kB)
    chunkSizeWarningLimit: 600,
  },
  // Enable source maps in production for easier debugging
  // (remove this line to slightly reduce bundle size)
  // sourcemap: true,
})
