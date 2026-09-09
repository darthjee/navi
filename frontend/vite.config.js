import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': [
            'react',
            'react-dom',
            'react-dom/client',
            'react-router-dom',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
          ],
        },
        chunkFileNames: (chunkInfo) =>
          chunkInfo.name === 'react-vendor'
            ? 'assets/react-vendor.js'
            : 'assets/[name]-[hash].js',
      },
    },
  },
  server: {
    port: 8080,
    host: '0.0.0.0',
    strictPort: false,
    cors: true,
  },
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
});
