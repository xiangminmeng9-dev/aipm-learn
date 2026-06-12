import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: '/knowledge-graph/',
  build: {
    outDir: '../public/knowledge-graph',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
