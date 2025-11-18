import { contextBridge, ipcRenderer } from 'electron';

import { createLogger } from '@/logger/renderer';
import type { Provider, ProviderSettings } from '@/settings-data';

contextBridge.exposeInMainWorld('settingsAPI', {
  openPromptsFile: (): Promise<void> => {
    return ipcRenderer.invoke('settings:open-prompts-file');
  },
  getSettings: (): Promise<ProviderSettings> => {
    return ipcRenderer.invoke('settings:get');
  },
  saveSettings: (settings: ProviderSettings): Promise<void> => {
    return ipcRenderer.invoke('settings:save', settings);
  },
  getModels: (provider: Provider) => {
    return ipcRenderer.invoke('settings:get-models', provider);
  },
});

contextBridge.exposeInMainWorld('logger', createLogger('Settings'));
