import { contextBridge, ipcRenderer } from "electron";

import { exposeConversations } from "@/services/conversations/renderer";
import { exposeLogger } from "@/services/logger/renderer";

// Expose logger to renderer
exposeLogger();

exposeConversations();

// Expose conversations API (service methods + window-specific methods)
contextBridge.exposeInMainWorld("ConversationsWindow", {
  openConversation: (id: string): Promise<void> => {
    return ipcRenderer.invoke("conversations-window:open", id);
  },
  revealDirectory: (): Promise<void> => {
    return ipcRenderer.invoke("conversations-window:reveal");
  },
});
