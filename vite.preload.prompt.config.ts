import { readFileSync } from 'node:fs';
import path from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: 'prompt-preload.js',
      },
    },
  },
  esbuild: {
    tsconfigRaw: JSON.parse(
      readFileSync(path.resolve(__dirname, './tsconfig.preload.json'), 'utf-8'),
    ) as Record<string, unknown>,
  },
});
