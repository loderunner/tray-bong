import path from 'node:path';

import { BrowserWindow, ipcMain, shell } from 'electron';

import { getPromptsFilePath } from '../prompts';

declare const SETTINGS_VITE_DEV_SERVER_URL: string;
declare const SETTINGS_VITE_NAME: string;

let settingsWindow: BrowserWindow | null = null;

export function createSettingsWindow(): void {
  if (settingsWindow !== null) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'settings-preload.js'),
      sandbox: process.env.NODE_ENV !== 'development',
      devTools: true,
    },
  });

  if (SETTINGS_VITE_DEV_SERVER_URL !== '') {
    void settingsWindow.loadURL(
      `${SETTINGS_VITE_DEV_SERVER_URL}/settings.html`,
    );
  } else {
    void settingsWindow.loadFile(
      path.join(
        __dirname,
        '..',
        'renderer',
        SETTINGS_VITE_NAME,
        'settings.html',
      ),
    );
  }

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

export function setupSettingsIPCHandlers(): void {
  ipcMain.handle('settings:open-prompts-file', () => {
    const filePath = getPromptsFilePath();
    void shell.openPath(filePath);
  });
}
