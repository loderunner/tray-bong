import path from 'node:path';

import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import type { UIMessage, UIMessageChunk } from 'ai';
import { convertToModelMessages, smoothStream, streamText } from 'ai';
import { BrowserWindow, ipcMain } from 'electron';
import type { MessageEvent } from 'electron';
import { createOllama } from 'ollama-ai-provider-v2';

import * as logger from '@/logger/main';
import type { SystemPrompt } from '@/prompts';
import { loadSettings } from '@/settings-data';

declare const PROMPT_VITE_DEV_SERVER_URL: string | undefined;
declare const PROMPT_VITE_NAME: string | undefined;

export type StreamChatMessageData =
  | { chunks: UIMessageChunk[] }
  | { done: true }
  | { error: string };

export type StreamChatControlMessage = { abort: true };

let promptWindow: BrowserWindow | null = null;
let currentPromptLabel: string = '';
let currentSystemPrompt: string = '';

async function getModel(): Promise<LanguageModel> {
  const settings = await loadSettings();

  switch (settings.provider) {
    case 'openai': {
      const provider = createOpenAI({ apiKey: settings.apiKey });
      return provider(settings.model);
    }
    case 'anthropic': {
      const provider = createAnthropic({ apiKey: settings.apiKey });
      return provider(settings.model);
    }
    case 'google': {
      const provider = createGoogleGenerativeAI({ apiKey: settings.apiKey });
      return provider(settings.model);
    }
    case 'ollama': {
      const baseURL =
        settings.ollamaEndpoint !== undefined && settings.ollamaEndpoint !== ''
          ? `${settings.ollamaEndpoint}/api`
          : 'http://localhost:11434/api';
      const provider = createOllama({ baseURL });
      return provider(settings.model);
    }
  }
}

export function createPromptWindow(prompt: SystemPrompt): void {
  if (promptWindow !== null) {
    promptWindow.focus();
    return;
  }

  currentPromptLabel = prompt.label;
  currentSystemPrompt = prompt.prompt;

  const preloadPath = path.join(__dirname, 'prompt-preload.js');

  promptWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: preloadPath,
      sandbox: process.env.NODE_ENV !== 'development',
    },
  });

  promptWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      logger.error(
        `Prompt window: did-fail-load - code: ${errorCode}, description: ${errorDescription}, URL: ${validatedURL}`,
      );
    },
  );

  promptWindow.webContents.on('render-process-gone', (_event, details) => {
    logger.error(
      `Prompt window: renderer process gone - reason: ${details.reason}`,
    );
  });

  promptWindow.on('unresponsive', () => {
    logger.error('Prompt window: became unresponsive');
  });

  const isDevServer =
    PROMPT_VITE_DEV_SERVER_URL !== undefined &&
    PROMPT_VITE_DEV_SERVER_URL !== '';

  if (isDevServer) {
    const url = `${PROMPT_VITE_DEV_SERVER_URL}/prompt.html`;
    logger.info(`Loading prompt from dev server: ${url}`);
    void promptWindow.loadURL(url);
  } else {
    const htmlPath = path.join(
      __dirname,
      '..',
      'renderer',
      PROMPT_VITE_NAME!,
      'prompt.html',
    );

    logger.info(`Loading prompt from file: ${htmlPath}`);

    void promptWindow.loadFile(htmlPath);
  }

  promptWindow.on('blur', () => {
    if (process.env.NODE_ENV !== 'development') {
      promptWindow?.close();
    }
  });
  promptWindow.on('closed', () => {
    promptWindow = null;
    currentPromptLabel = '';
    currentSystemPrompt = '';
  });
}

export function setupPromptIPCHandlers(): void {
  ipcMain.handle('prompt:get-info', () => {
    return {
      label: currentPromptLabel,
      systemPrompt: currentSystemPrompt,
    };
  });

  ipcMain.on(
    'prompt:stream-chat',
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
        const modelMessages = convertToModelMessages(uiMessages);
        const model = await getModel();

        const result = streamText({
          model,
          messages: modelMessages,
          experimental_transform: smoothStream(),
          abortSignal: abortController.signal,
        });

        const uiStream = result.toUIMessageStream({
          originalMessages: uiMessages,
        });

        logger.info(
          `Starting stream, originalMessages count: ${uiMessages.length}`,
        );

        let chunkCount = 0;
        for await (const chunk of uiStream) {
          if (abortController.signal.aborted) {
            logger.debug('Stream aborted during iteration');
            break;
          }

          chunkCount++;
          logger.debug(
            `Stream chunk ${chunkCount}: type=${chunk.type}, id=${'id' in chunk ? chunk.id : 'N/A'}`,
          );
          port.postMessage({ chunks: [chunk] });
        }

        // Only send done/close if not aborted
        if (!abortController.signal.aborted) {
          logger.info(`Stream complete, total chunks: ${chunkCount}`);
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
