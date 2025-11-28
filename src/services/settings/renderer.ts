import { contextBridge, ipcRenderer } from 'electron';

import { Models } from './models';
import { type Settings } from './settings';

/**
 * Exposes settings API to the renderer process via context bridge.
 */
export function exposeSettings(): void {
  contextBridge.exposeInMainWorld('Settings', {
    getSettings: (): Promise<Settings> => {
      return ipcRenderer.invoke('settings:get');
    },
    saveSettings: (settings: Settings): Promise<void> => {
      return ipcRenderer.invoke('settings:save', settings);
    },
    Models,
  });
}
