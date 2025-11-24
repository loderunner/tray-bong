import { ipcMain } from 'electron';

import { type Conversation, saveConversation } from './main';

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
}
