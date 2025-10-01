import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // REMOVER: base: '/FullForceAcademia/'
  // Para Netlify, base: '/' é o padrão (não precisa declarar)
  build: {
    outDir: 'dist',
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
})
