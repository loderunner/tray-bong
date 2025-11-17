import { contextBridge, ipcRenderer } from 'electron';

import { createLogger } from '../logger/renderer';

contextBridge.exposeInMainWorld('promptAPI', {
  getPromptLabel: (): Promise<string> => {
    return ipcRenderer.invoke('prompt:get-label');
  },
});

contextBridge.exposeInMainWorld('logger', createLogger('Prompt'));
