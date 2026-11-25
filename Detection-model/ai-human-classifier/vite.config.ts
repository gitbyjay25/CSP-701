import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://127.0.0.1:7860',
      '/classify-text': 'http://127.0.0.1:7860',
      '/classify': 'http://127.0.0.1:7860',
    },
  },
  build: {
    target: 'es2022',
  },
});

