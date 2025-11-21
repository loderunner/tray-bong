import { readFileSync } from 'node:fs';
import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: 'prompt.html',
    },
    sourcemap: true,
  },
  esbuild: {
    tsconfigRaw: JSON.parse(
      readFileSync(
        path.resolve(__dirname, './tsconfig.renderer.json'),
        'utf-8',
      ),
    ) as Record<string, unknown>,
  },
});
