import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_KEY': JSON.stringify(process.env.VITE_API_KEY)
  },
  // For Capacitor mobile build
  server: {
    port: 3000
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase': ['firebase/app', 'firebase/firestore', 'firebase/storage'],
          'jspdf-vendor': ['jspdf', 'jspdf-autotable'],
          'html2canvas-vendor': ['html2canvas'],
          'dompurify-vendor': ['dompurify', 'isomorphic-dompurify']
        }
      }
    }
  }
})