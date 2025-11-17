import path from 'node:path';

import { BrowserWindow, ipcMain } from 'electron';

import * as logger from '../logger/main';
import type { SystemPrompt } from '../prompts';

declare const PROMPT_VITE_DEV_SERVER_URL: string | undefined;
declare const PROMPT_VITE_NAME: string | undefined;

let promptWindow: BrowserWindow | null = null;
let currentPromptLabel: string = '';

export function createPromptWindow(prompt: SystemPrompt): void {
  if (promptWindow !== null) {
    promptWindow.focus();
    return;
  }

  currentPromptLabel = prompt.label;

  const preloadPath = path.join(__dirname, 'prompt-preload.js');

  promptWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: preloadPath,
      sandbox: process.env.NODE_ENV !== 'development',
    },
  });

  promptWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      logger.error(
        `Prompt window: did-fail-load - code: ${errorCode}, description: ${errorDescription}, URL: ${validatedURL}`,
      );
    },
  );

  promptWindow.webContents.on('render-process-gone', (_event, details) => {
    logger.error(
      `Prompt window: renderer process gone - reason: ${details.reason}`,
    );
  });

  promptWindow.on('unresponsive', () => {
    logger.error('Prompt window: became unresponsive');
  });

  const isDevServer =
    PROMPT_VITE_DEV_SERVER_URL !== undefined &&
    PROMPT_VITE_DEV_SERVER_URL !== '';

  if (isDevServer) {
    const url = `${PROMPT_VITE_DEV_SERVER_URL}/prompt.html`;
    logger.info(`Loading prompt from dev server: ${url}`);
    void promptWindow.loadURL(url);
  } else {
    const htmlPath = path.join(
      __dirname,
      '..',
      'renderer',
      PROMPT_VITE_NAME!,
      'prompt.html',
    );

    logger.info(`Loading prompt from file: ${htmlPath}`);

    void promptWindow.loadFile(htmlPath);
  }

  promptWindow.on('blur', () => {
    promptWindow?.close();
  });
  promptWindow.on('closed', () => {
    promptWindow = null;
    currentPromptLabel = '';
  });
}

export function setupPromptIpcHandlers(): void {
  ipcMain.handle('prompt:get-label', () => {
    return currentPromptLabel;
  });
}
