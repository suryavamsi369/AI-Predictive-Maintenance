import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/predict': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/machines': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/predictions': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/model-info': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/health': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
});

