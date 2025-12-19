import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const resolvePath = (p) => path.resolve(process.cwd(), p);

export default defineConfig({
  root: resolvePath('src/renderer'),
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: resolvePath('dist/renderer'),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolvePath('src/renderer'),
      '#shared': resolvePath('src/shared')
    }
  }
});
