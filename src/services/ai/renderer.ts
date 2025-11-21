import type { UIMessage, UIMessageChunk } from 'ai';
import { contextBridge, ipcRenderer } from 'electron';

import type { StreamChatMessageData } from './ipc';

import { createLogger } from '@/services/logger/renderer';

const logger = createLogger('AI:Renderer');

/**
 * Exposes AI API to the renderer process via context bridge.
 */
export function exposeAI(): void {
  contextBridge.exposeInMainWorld('AI', {
    streamChat: ({
      messages,
      onChunk,
      onDone,
      onError,
    }: {
      messages: UIMessage[];
      onChunk: (chunk: UIMessageChunk) => void;
      onDone: () => void;
      onError: (error: string) => void;
    }): (() => void) => {
      logger.info(`streamChat called with ${messages.length} messages`);

      const { port1, port2 } = new MessageChannel();

      port1.start();

      ipcRenderer.postMessage('ai:stream-chat', { messages }, [port2]);

      port1.onmessage = (event: MessageEvent<StreamChatMessageData>) => {
        try {
          const messageData = event.data;

          if ('error' in messageData) {
            logger.error(`Stream error: ${messageData.error}`);
            onError(messageData.error);
            port1.close();
            return;
          }

          if ('done' in messageData) {
            logger.info('Stream done');
            onDone();
            port1.close();
            return;
          }

          if ('chunk' in messageData) {
            onChunk(messageData.chunk);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Error in port1.onmessage: ${errorMessage}`);
          onError(errorMessage);
          port1.close();
        }
      };

      let isCleanedUp = false;
      return () => {
        if (isCleanedUp) {
          logger.debug('Cleanup already called, returning');
          return;
        }
        isCleanedUp = true;
        logger.info('Cleanup called, aborting stream');
        port1.postMessage({ abort: true });
        port1.close();
      };
    },
    generateText: (prompt: string): Promise<string> => {
      return ipcRenderer.invoke('ai:generate-text', prompt);
    },
  });
}
