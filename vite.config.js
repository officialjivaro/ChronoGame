import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],

  base: './',

  build: {
    outDir: 'docs',

    assetsDir: '',

    rollupOptions: {
      output: {

        entryFileNames: 'ChronoGame/assets/[name]-[hash].js',
        chunkFileNames: 'ChronoGame/assets/[name]-[hash].js',
        assetFileNames: 'ChronoGame/assets/[name]-[hash].[ext]'
      }
    }
  }
})
