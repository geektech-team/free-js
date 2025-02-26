import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './examples/index.ts',
      name: 'index',
      fileName: 'index'
    }
  }
})
