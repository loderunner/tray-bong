import { contextBridge, ipcRenderer } from 'electron';

import type { SystemPrompt } from './main';

/**
 * Exposes prompts API to the renderer process via context bridge.
 */
export function exposePrompts(): void {
  contextBridge.exposeInMainWorld('Prompts', {
    listPrompts: (): Promise<SystemPrompt[]> => {
      return ipcRenderer.invoke('prompts:list');
    },
  });
}
