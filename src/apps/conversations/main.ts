import path from "node:path";

import { BrowserWindow, ipcMain, shell } from "electron";

import { createPromptWindow } from "@/apps/prompt/main";
import {
  getConversationsDirectory,
  loadConversation,
} from "@/services/conversations/main";
import * as logger from "@/services/logger/main";

declare const CONVERSATIONS_VITE_DEV_SERVER_URL: string | undefined;
declare const CONVERSATIONS_VITE_NAME: string | undefined;

let conversationsWindow: BrowserWindow | null = null;

export function createConversationsWindow(): void {
  if (conversationsWindow !== null) {
    conversationsWindow.focus();
    return;
  }

  const preloadPath = path.join(__dirname, "conversations-preload.js");

  conversationsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    webPreferences: {
      preload: preloadPath,
      sandbox: process.env.NODE_ENV !== "development",
      devTools: true,
    },
  });

  conversationsWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      logger.error(
        `Conversations window: did-fail-load - code: ${errorCode}, description: ${errorDescription}, URL: ${validatedURL}`,
      );
    },
  );

  conversationsWindow.webContents.on(
    "render-process-gone",
    (_event, details) => {
      logger.error(
        `Conversations window: renderer process gone - reason: ${details.reason}`,
      );
    },
  );

  conversationsWindow.on("unresponsive", () => {
    logger.error("Conversations window: became unresponsive");
  });

  const isDevServer =
    CONVERSATIONS_VITE_DEV_SERVER_URL !== undefined &&
    CONVERSATIONS_VITE_DEV_SERVER_URL !== "";

  if (isDevServer) {
    const url = `${CONVERSATIONS_VITE_DEV_SERVER_URL}/conversations.html`;
    logger.info(`Loading conversations from dev server: ${url}`);
    void conversationsWindow.loadURL(url);
  } else {
    const htmlPath = path.join(
      __dirname,
      "..",
      "..",
      "renderer",
      CONVERSATIONS_VITE_NAME!,
      "conversations.html",
    );

    logger.info(`Loading conversations from file: ${htmlPath}`);

    void conversationsWindow.loadFile(htmlPath);
  }

  conversationsWindow.on("closed", () => {
    conversationsWindow = null;
  });
}

export function setupConversationsWindowIPC(): void {
  ipcMain.handle("conversations-window:open", async (_event, id: string) => {
    const conversation = await loadConversation(id);
    await createPromptWindow(conversation);
    if (conversationsWindow !== null) {
      conversationsWindow.close();
    }
  });

  ipcMain.handle("conversations-window:reveal", () => {
    const directory = getConversationsDirectory();
    void shell.openPath(directory);
  });
}
