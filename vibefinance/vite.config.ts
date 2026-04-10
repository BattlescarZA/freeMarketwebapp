import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 19111,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: true,
    cors: true,
  },
  preview: {
    port: 19111,
    host: '0.0.0.0',
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
