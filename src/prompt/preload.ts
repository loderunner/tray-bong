import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('promptAPI', {
  getPromptLabel: (): Promise<string> => {
    return ipcRenderer.invoke('prompt:get-label');
  },
});
