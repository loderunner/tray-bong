import { contextBridge, ipcRenderer } from 'electron';

import { exposeLogger } from '@/services/logger/renderer';
import { exposePrompts } from '@/services/prompts/renderer';
import { exposeSettings } from '@/services/settings/renderer';

// Expose logger to renderer
exposeLogger('Settings');

// Expose settings service
exposeSettings();

// Expose prompts service
exposePrompts();

contextBridge.exposeInMainWorld('SettingsWindow', {
  revealPromptsFile: (): Promise<void> => {
    return ipcRenderer.invoke('settings-window:reveal-prompts');
  },
});
