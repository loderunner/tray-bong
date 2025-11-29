import { contextBridge, ipcRenderer } from 'electron';

import { exposeAI } from '@/services/ai/renderer';
import type { Conversation } from '@/services/conversations/conversation';
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
  startDrag: (mouseX: number, mouseY: number): void => {
    ipcRenderer.send('prompt-window:start-drag', { mouseX, mouseY });
  },
  dragMove: (x: number, y: number): void => {
    ipcRenderer.send('prompt-window:drag-move', { x, y });
  },
  endDrag: (): void => {
    ipcRenderer.send('prompt-window:end-drag');
  },
});
