import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

<<<<<<< HEAD
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
=======
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
>>>>>>> origin/main
})
