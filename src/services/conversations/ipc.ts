import { ipcMain } from 'electron';

import type { Conversation } from './conversation';
import { listConversations, saveConversation } from './main';

/**
 * Sets up IPC handlers for conversations service.
 * Must be called after the app is ready.
 */
export function setupConversationsIPC(): void {
  ipcMain.handle(
    'conversations:save',
    async (_event, conversation: Conversation) => {
      await saveConversation(conversation);
    },
  );

  ipcMain.handle(
    'conversations:list',
    async (_event, limit: number, offset: number) => {
      return await listConversations(limit, offset);
    },
  );
}
