import { contextBridge, ipcRenderer } from 'electron';

import { PROVIDER_MODELS, type ProviderSettings } from './main';

type SettingsFile = {
  version: number;
  currentProvider: 'openai' | 'anthropic' | 'google' | 'ollama';
  openai: { model: string; apiKey: string; ollamaEndpoint?: string };
  anthropic: { model: string; apiKey: string; ollamaEndpoint?: string };
  google: { model: string; apiKey: string; ollamaEndpoint?: string };
  ollama: { model: string; apiKey: string; ollamaEndpoint?: string };
};

/**
 * Exposes settings API to the renderer process via context bridge.
 */
export function exposeSettings(): void {
  contextBridge.exposeInMainWorld('Settings', {
    getSettings: (): Promise<ProviderSettings> => {
      return ipcRenderer.invoke('settings:get');
    },
    getAllSettings: (): Promise<SettingsFile> => {
      return ipcRenderer.invoke('settings:getAll');
    },
    saveSettings: (settings: ProviderSettings): Promise<void> => {
      return ipcRenderer.invoke('settings:save', settings);
    },
    PROVIDER_MODELS,
  });
}
