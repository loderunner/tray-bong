import path from 'node:path';

import { BrowserWindow, clipboard, ipcMain, nativeImage } from 'electron';

import type { Conversation } from '@/services/conversations/main';
import { useLogger } from '@/services/logger/useLogger';
import { markMenuNeedsUpdate } from '@/tray';

declare const PROMPT_VITE_DEV_SERVER_URL: string | undefined;
declare const PROMPT_VITE_NAME: string | undefined;

let promptWindow: BrowserWindow | null = null;
let currentConversation: Conversation | null = null;

export async function createPromptWindow(
  conversation: Conversation,
): Promise<void> {
  const logger = useLogger('PromptWindow');

  markMenuNeedsUpdate();

  // If window exists with same conversation, just show it
  if (promptWindow !== null && currentConversation?.id === conversation.id) {
    showPromptWindow();
    return;
  }

  // If window exists with different conversation, destroy it
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
    promptWindow?.hide();
    markMenuNeedsUpdate();
  });
  promptWindow.on('closed', () => {
    promptWindow = null;
    currentConversation = null;
  });
}

export function showPromptWindow(): void {
  if (promptWindow !== null) {
    promptWindow.show();
    promptWindow.focus();
    void promptWindow.webContents.executeJavaScript(
      `document.getElementById('message-input')?.focus()`,
    );
  }
}

export function hasPromptWindow(): boolean {
  return promptWindow !== null;
}

export function setupPromptWindowIPC(): void {
  ipcMain.handle('prompt-window:get-info', () => {
    if (currentConversation === null) {
      throw new Error('No conversation available');
    }
    return currentConversation;
  });

  // Manual window drag implementation to work around Chromium bug where
  // -webkit-app-region: drag doesn't respect overflow: hidden clipping
  ipcMain.on(
    'prompt-window:start-drag',
    (event, { mouseX, mouseY }: { mouseX: number; mouseY: number }) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win === null) {
        return;
      }

      const [winX, winY] = win.getPosition();
      const offsetX = mouseX - winX;
      const offsetY = mouseY - winY;

      const onMouseMove = (
        _event: Electron.IpcMainEvent,
        { x, y }: { x: number; y: number },
      ) => {
        win.setPosition(x - offsetX, y - offsetY);
      };

      const onMouseUp = () => {
        ipcMain.removeListener('prompt-window:drag-move', onMouseMove);
        ipcMain.removeListener('prompt-window:end-drag', onMouseUp);
      };

      ipcMain.on('prompt-window:drag-move', onMouseMove);
      ipcMain.on('prompt-window:end-drag', onMouseUp);
    },
  );

  ipcMain.handle(
    'prompt-window:get-sf-symbol',
    (_event, symbolName: string) => {
      const logger = useLogger('PromptWindow');
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
