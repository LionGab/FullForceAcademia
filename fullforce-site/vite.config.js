import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path para GitHub Pages
  // Se o repo for github.com/usuario/fullforce-site, use '/fullforce-site/'
  // Se for github.com/usuario/usuario.github.io, use '/'
  base: process.env.GITHUB_ACTIONS 
    ? (process.env.GITHUB_REPOSITORY?.split('/')[1] || '/fullforce-site/').replace(/^/, '/').replace(/\/$/, '') + '/'
    : '/',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
