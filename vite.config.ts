import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import tailwindCss from '@tailwindcss/vite'
import autoprefixer from 'autoprefixer'


// https://vite.dev/config/
export default defineConfig({
  css: {
    postcss: {
      plugins: [autoprefixer()]
    }
  },
  plugins: [react(),tailwindCss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
})
