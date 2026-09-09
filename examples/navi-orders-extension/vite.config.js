import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: 'src/frontend/entry.js', formats: ['es'], fileName: () => 'orders.js' },
    outDir: 'dist/frontend',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        'react', 'react-dom', 'react-dom/client',
        'react-router-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime',
      ],
    },
  },
});
