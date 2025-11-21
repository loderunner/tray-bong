import { contextBridge, ipcRenderer } from 'electron';

import { exposeAI } from '@/services/ai/renderer';
import { exposeLoggerFactory } from '@/services/logger/renderer';

// Expose logger factory to renderer
exposeLoggerFactory();

// Expose AI service
exposeAI();

// Expose prompt window utilities
contextBridge.exposeInMainWorld('PromptWindow', {
  getPromptInfo: (): Promise<{ label: string; systemPrompt: string }> => {
    return ipcRenderer.invoke('prompt-window:get-info');
  },
  getSFSymbol: (symbolName: string): Promise<string | null> => {
    return ipcRenderer.invoke('prompt-window:get-sf-symbol', symbolName);
  },
  copyToClipboard: (text: string): Promise<void> => {
    return ipcRenderer.invoke('prompt-window:copy-to-clipboard', text);
  },
});
