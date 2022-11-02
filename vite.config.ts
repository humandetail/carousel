import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'Carousel',
      fileName: 'carousel',
      formats: ['es', 'iife', 'cjs', 'umd']
    }
  },
  plugins: [
    dts()
  ]
})
