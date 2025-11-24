import { contextBridge, ipcRenderer } from 'electron';

import type { Conversation } from './main';

/**
 * Exposes conversations API to the renderer process via context bridge.
 */
export function exposeConversations(): void {
  contextBridge.exposeInMainWorld('Conversations', {
    saveConversation: (conversation: Conversation): Promise<void> => {
      return ipcRenderer.invoke('conversations:save', conversation);
    },
  });
}
