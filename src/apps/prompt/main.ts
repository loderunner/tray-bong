import path from 'node:path';

import { BrowserWindow, clipboard, ipcMain, nativeImage } from 'electron';

import type { Conversation } from '@/services/conversations/main';
import { createLogger } from '@/services/logger/main';

const logger = createLogger('PromptWindow');

declare const PROMPT_VITE_DEV_SERVER_URL: string | undefined;
declare const PROMPT_VITE_NAME: string | undefined;

let promptWindow: BrowserWindow | null = null;
let currentConversation: Conversation | null = null;

export async function createPromptWindow(
  conversation: Conversation,
): Promise<void> {
  if (promptWindow !== null) {
    promptWindow.destroy();
  }

  currentConversation = conversation;

  const preloadPath = path.join(__dirname, 'prompt-preload.js');

  promptWindow = new BrowserWindow({
    width: 800,
    height: 600,
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
    currentConversation = null;
  });
}

export function setupPromptWindowIPC(): void {
  ipcMain.handle('prompt-window:get-info', () => {
    if (currentConversation === null) {
      throw new Error('No conversation available');
    }
    return currentConversation;
  });

  ipcMain.handle(
    'prompt-window:get-sf-symbol',
    (_event, symbolName: string) => {
      try {
        const image = nativeImage.createFromNamedImage(symbolName);
        const png = image.toPNG();
        const dataURL = `data:image/png;base64,${png.toString('base64')}`;
        return dataURL;
      } catch (error) {
        logger.error(
          `Failed to get SF Symbol ${symbolName}: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      }
    },
  );

  ipcMain.handle('prompt-window:copy-to-clipboard', (_event, text: string) => {
    clipboard.writeText(text);
  });
}
