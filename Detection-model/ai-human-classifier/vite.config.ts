import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5174,
  },
  build: {
    target: 'es2022',
  },
});

