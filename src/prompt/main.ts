import path from 'node:path';

import { BrowserWindow, ipcMain } from 'electron';

import type { SystemPrompt } from '../prompts';

declare const PROMPT_VITE_DEV_SERVER_URL: string;
declare const PROMPT_VITE_NAME: string;

let promptWindow: BrowserWindow | null = null;
let currentPromptLabel: string = '';

export function createPromptWindow(prompt: SystemPrompt): void {
  if (promptWindow !== null) {
    promptWindow.focus();
    return;
  }

  currentPromptLabel = prompt.label;

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
      preload: path.join(__dirname, 'prompt-preload.js'),
      sandbox: process.env.NODE_ENV !== 'development',
    },
  });

  if (PROMPT_VITE_DEV_SERVER_URL !== '') {
    void promptWindow.loadURL(`${PROMPT_VITE_DEV_SERVER_URL}/prompt.html`);
  } else {
    void promptWindow.loadFile(
      path.join(__dirname, '..', 'renderer', PROMPT_VITE_NAME, 'prompt.html'),
    );
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
