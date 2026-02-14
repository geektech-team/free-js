import { defineConfig } from 'vite'
import { resolve } from 'path';

export default defineConfig({
  root: './examples',
  build: {
    outDir: '../dist',
    lib: {
      entry: '../lib/index.ts',
      name: 'FreeJS',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
    sourcemap: true,
  },
  server: {
    port: 54321,
    open: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './lib'),
    },
  },
});
