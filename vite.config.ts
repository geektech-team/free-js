import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './demo/index.ts',
      name: 'index',
      fileName: 'index'
    }
  }
})
