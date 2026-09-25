import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        imagen4d: resolve(process.cwd(), 'imagen4d.html')
      }
    }
  }
});
