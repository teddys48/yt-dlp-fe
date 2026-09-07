import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: process.env.VITE_API_TARGET || 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
