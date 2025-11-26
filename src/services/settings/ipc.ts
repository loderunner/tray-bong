import { ipcMain } from 'electron';

import {
  type Provider,
  type ProviderSettings,
  loadSettings,
  loadSettingsForProvider,
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

  ipcMain.handle('settings:getForProvider', async (_event, provider: Provider) => {
    return await loadSettingsForProvider(provider);
  });

  ipcMain.handle(
    'settings:save',
    async (_event, settings: ProviderSettings) => {
      await saveSettings(settings);
    },
  );
}
