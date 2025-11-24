import path from 'node:path';

import { BrowserWindow, ipcMain, shell } from 'electron';

import { useLogger } from '@/services/logger/useLogger';
import { getPromptsFilePath } from '@/services/prompts/main';

declare const SETTINGS_VITE_DEV_SERVER_URL: string | undefined;
declare const SETTINGS_VITE_NAME: string | undefined;

let settingsWindow: BrowserWindow | null = null;

export function createSettingsWindow(): void {
  const logger = useLogger('SettingsWindow');
  if (settingsWindow !== null) {
    settingsWindow.focus();
    return;
  }

  const preloadPath = path.join(__dirname, 'settings-preload.js');

  settingsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    webPreferences: {
      preload: preloadPath,
      sandbox: process.env.NODE_ENV !== 'development',
      devTools: true,
    },
  });

  settingsWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      logger.error(
        `Settings window: did-fail-load - code: ${errorCode}, description: ${errorDescription}, URL: ${validatedURL}`,
      );
    },
  );

  settingsWindow.webContents.on('render-process-gone', (_event, details) => {
    logger.error(
      `Settings window: renderer process gone - reason: ${details.reason}`,
    );
  });

  settingsWindow.on('unresponsive', () => {
    logger.error('Settings window: became unresponsive');
  });

  const isDevServer =
    SETTINGS_VITE_DEV_SERVER_URL !== undefined &&
    SETTINGS_VITE_DEV_SERVER_URL !== '';

  if (isDevServer) {
    const url = `${SETTINGS_VITE_DEV_SERVER_URL}/settings.html`;
    logger.info(`Loading settings from dev server: ${url}`);
    void settingsWindow.loadURL(url);
  } else {
    const htmlPath = path.join(
      __dirname,
      '..',
      '..',
      'renderer',
      SETTINGS_VITE_NAME!,
      'settings.html',
    );

    logger.info(`Loading settings from file: ${htmlPath}`);

    void settingsWindow.loadFile(htmlPath);
  }

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

export function setupSettingsWindowIPC(): void {
  ipcMain.handle('settings-window:reveal-prompts', () => {
    const filePath = getPromptsFilePath();
    void shell.showItemInFolder(filePath);
  });
}
