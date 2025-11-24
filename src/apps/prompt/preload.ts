import { contextBridge, ipcRenderer } from 'electron';

import { exposeAI } from '@/services/ai/renderer';
import type { Conversation } from '@/services/conversations/main';
import { exposeConversations } from '@/services/conversations/renderer';
import { exposeLogger } from '@/services/logger/renderer';

// Expose logger to renderer
exposeLogger();

// Expose AI service
exposeAI();

// Expose conversations service
exposeConversations();

// Expose prompt window utilities
contextBridge.exposeInMainWorld('PromptWindow', {
  getPromptInfo: (): Promise<Conversation> => {
    return ipcRenderer.invoke('prompt-window:get-info');
  },
  getSFSymbol: (symbolName: string): Promise<string | null> => {
    return ipcRenderer.invoke('prompt-window:get-sf-symbol', symbolName);
  },
  copyToClipboard: (text: string): Promise<void> => {
    return ipcRenderer.invoke('prompt-window:copy-to-clipboard', text);
  },
});
