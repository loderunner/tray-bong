import { ipcMain } from 'electron';

import { getConversationWindowBounds } from '@/apps/prompt/main';
import { type Conversation, listConversations, saveConversation } from './main';

/**
 * Sets up IPC handlers for conversations service.
 * Must be called after the app is ready.
 */
export function setupConversationsIPC(): void {
  ipcMain.handle(
    'conversations:save',
    async (_event, conversation: Conversation) => {
      // Update conversation with current window bounds if the window is open
      const bounds = getConversationWindowBounds(conversation.id);
      if (bounds !== null) {
        conversation.windowBounds = bounds;
      }
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
