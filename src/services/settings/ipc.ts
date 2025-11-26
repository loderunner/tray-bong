import { ipcMain } from 'electron';

import {
  type ProviderSettings,
  loadAllSettings,
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

  ipcMain.handle('settings:getAll', async () => {
    return await loadAllSettings();
  });

  ipcMain.handle(
    'settings:save',
    async (_event, settings: ProviderSettings) => {
      await saveSettings(settings);
    },
  );
}
