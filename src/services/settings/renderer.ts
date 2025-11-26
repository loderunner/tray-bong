import { contextBridge, ipcRenderer } from 'electron';

import {
  PROVIDER_MODELS,
  type Provider,
  type ProviderSettings,
} from './main';

/**
 * Exposes settings API to the renderer process via context bridge.
 */
export function exposeSettings(): void {
  contextBridge.exposeInMainWorld('Settings', {
    getSettings: (): Promise<ProviderSettings> => {
      return ipcRenderer.invoke('settings:get');
    },
    getSettingsForProvider: (
      provider: Provider,
    ): Promise<Omit<ProviderSettings, 'provider'>> => {
      return ipcRenderer.invoke('settings:getForProvider', provider);
    },
    saveSettings: (settings: ProviderSettings): Promise<void> => {
      return ipcRenderer.invoke('settings:save', settings);
    },
    PROVIDER_MODELS,
  });
}
