import { ipcMain } from 'electron';

import { loadSettings, saveSettings } from './main';
import { type Settings } from './settings';

/**
 * Sets up IPC handlers for settings service.
 * Must be called after the app is ready.
 */
export function setupSettingsIPC(): void {
  ipcMain.handle('settings:get', async () => {
    return await loadSettings();
  });

  ipcMain.handle('settings:save', async (_event, settings: Settings) => {
    await saveSettings(settings);
  });
}
