import { ipcMain } from 'electron';

import { loadPrompts } from './main';

/**
 * Sets up IPC handlers for prompts service.
 * Must be called after the app is ready.
 */
export function setupPromptsIPC(): void {
  ipcMain.handle('prompts:list', async () => {
    return await loadPrompts();
  });
}
