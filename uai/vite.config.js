import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Otimizações de build
    target: 'es2015',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Code splitting otimizado
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react'],
          utils: ['./src/utils/analytics', './src/utils/constants']
        }
      }
    },
    // Compressão
    cssCodeSplit: true,
    sourcemap: false,
    // Otimização de assets
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 500
  },
  server: {
    // Configurações do servidor de desenvolvimento
    port: 5173,
    host: true,
    open: false,
    cors: true
  },
  preview: {
    port: 4173,
    host: true
  },
  // Otimizações de dependências
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'lucide-react'
    ],
    exclude: []
  },
  // Performance
  esbuild: {
    // Remove console em produção
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
})
