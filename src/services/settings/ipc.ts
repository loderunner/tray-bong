import { ipcMain } from 'electron';

import {
  type Provider,
  type ProviderSettings,
  loadProviderSettings,
  loadSettings,
  saveSettings,
} from './main';

/**
 * Sets up IPC handlers for settings service.
 * Must be called after the app is ready.
 */
export function setupSettingsIPC(): void {
  ipcMain.handle('settings:get', async () => {
    return await loadSettings();
  });

  ipcMain.handle('settings:get-provider', async (_event, provider: Provider) => {
    return await loadProviderSettings(provider);
  });

  ipcMain.handle(
    'settings:save',
    async (_event, settings: ProviderSettings) => {
      await saveSettings(settings);
    },
  );
}
