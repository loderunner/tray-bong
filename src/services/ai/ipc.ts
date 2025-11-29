import type { UIMessage } from 'ai';
import { type MessageEvent, ipcMain } from 'electron';

import { generateTextFromPrompt, streamChat } from './main';
import type { StreamChatControlMessage } from './stream';

import { useLogger } from '@/services/logger/main';

/**
 * Sets up IPC handlers for AI service.
 * Must be called after the app is ready.
 */
export function setupAIIPC(): void {
  const logger = useLogger('AI');

  ipcMain.handle('ai:generate-text', async (_event, prompt: string) => {
    return await generateTextFromPrompt(prompt);
  });

  ipcMain.on(
    'ai:stream-chat',
    async (event, { messages: uiMessages }: { messages: UIMessage[] }) => {
      const [port] = event.ports;

      const abortController = new AbortController();

      // Listen for abort messages on the port
      port.on('message', (messageEvent: MessageEvent) => {
        const message = messageEvent.data as StreamChatControlMessage;
        if ('abort' in message) {
          logger.debug('Received abort message on port');
          abortController.abort();
          port.close();
        }
      });

      port.start();

      try {
        for await (const chunk of streamChat(
          uiMessages,
          abortController.signal,
        )) {
          if (abortController.signal.aborted) {
            logger.debug('Stream aborted during iteration');
            break;
          }

          port.postMessage({ chunk });
        }

        // Only send done/close if not aborted
        if (!abortController.signal.aborted) {
          logger.info('Stream complete');
          port.postMessage({ done: true });
          port.close();
        } else {
          logger.debug('Stream aborted, not sending done message');
        }
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          logger.debug('Stream aborted on AbortError');
          return;
        }

        let errorMessage: string;
        if (error instanceof Error) {
          errorMessage = error.message;
        } else {
          errorMessage = String(error);
        }
        logger.error(`Error streaming chat: ${errorMessage}`);
        port.postMessage({ error: errorMessage });
        port.close();
      }
    },
  );
}
