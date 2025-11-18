import type { UIMessage, UIMessageChunk } from 'ai';
import { contextBridge, ipcRenderer } from 'electron';

import type { StreamChatMessageData } from './main';

import { createLogger } from '@/logger/renderer';

// Create logger at module scope so it's available in all functions
const logger = createLogger('Prompt');

// Expose logger to renderer
contextBridge.exposeInMainWorld('logger', logger);

contextBridge.exposeInMainWorld('promptAPI', {
  getPromptLabel: (): Promise<string> => {
    return ipcRenderer.invoke('prompt:get-label');
  },
  streamChat: (
    messages: UIMessage[],
    callbacks: {
      onChunk: (chunk: UIMessageChunk) => void;
      onDone: () => void;
      onError: (error: string) => void;
    },
  ): void => {
    logger.info(`streamChat called with ${messages.length} messages`);

    const { port1, port2 } = new MessageChannel();

    port1.start();

    ipcRenderer.postMessage('prompt:stream-chat', { messages }, [port2]);

    let enqueuedCount = 0;
    port1.onmessage = (event: MessageEvent<StreamChatMessageData>) => {
      try {
        const messageData = event.data;

        if ('error' in messageData) {
          logger.error(`Stream error: ${messageData.error}`);
          callbacks.onError(messageData.error);
          port1.close();
          return;
        }

        if ('done' in messageData) {
          logger.info(`Stream done, total chunks enqueued: ${enqueuedCount}`);
          callbacks.onDone();
          port1.close();
          return;
        }

        if ('chunks' in messageData) {
          logger.debug(`Received ${messageData.chunks.length} chunks`);
          for (const chunk of messageData.chunks) {
            enqueuedCount++;
            logger.debug(
              `Calling onChunk ${enqueuedCount}: type=${chunk.type}, id=${'id' in chunk ? chunk.id : 'N/A'}`,
            );
            callbacks.onChunk(chunk);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error in port1.onmessage: ${errorMessage}`);
        callbacks.onError(errorMessage);
        port1.close();
      }
    };
  },
});
