import { contextBridge, ipcRenderer } from 'electron';

import { createLogger } from '../logger/renderer';

contextBridge.exposeInMainWorld('settingsAPI', {
  openPromptsFile: (): Promise<void> => {
    return ipcRenderer.invoke('settings:open-prompts-file');
  },
});

contextBridge.exposeInMainWorld('logger', createLogger('Settings'));
