import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('settingsAPI', {
  openPromptsFile: (): Promise<void> => {
    return ipcRenderer.invoke('settings:open-prompts-file');
  },
});
