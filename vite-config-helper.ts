import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { type UserConfig, defineConfig } from 'vite';

const baseConfig: UserConfig = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
  },
  optimizeDeps: {
    force: true,
    exclude: ['use-immer', '@phosphor-icons/react'],
  },
};

/**
 * Creates a preload config with the specified entry file name.
 *
 * @param entryFileName - The name of the entry file (e.g., 'conversations-preload.js')
 * @returns A vite config for a preload script
 */
export function createPreloadConfig(name: string): UserConfig {
  return defineConfig({
    ...baseConfig,
    build: {
      ...baseConfig.build,
      rollupOptions: {
        output: {
          entryFileNames: `${name}-preload.js`,
        },
      },
    },
  });
}

/**
 * Creates a renderer config with the specified HTML input file.
 *
 * @param htmlInput - The path to the HTML input file (e.g., 'conversations.html')
 * @returns A vite config for a renderer process
 */
export function createRendererConfig(name: string): UserConfig {
  return defineConfig({
    ...baseConfig,
    plugins: [react(), tailwindcss()],
    build: {
      ...baseConfig.build,
      rollupOptions: {
        input: `${name}.html`,
      },
    },
  });
}

/**
 * Creates the main process config.
 *
 * @returns A vite config for the main process
 */
export function createMainConfig(): UserConfig {
  return defineConfig(baseConfig);
}
