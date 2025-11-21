import { contextBridge, ipcRenderer } from 'electron';

/**
 * Exposes logger API to the renderer process via context bridge.
 *
 * @param rendererName - The name of the renderer process (e.g., 'Prompt', 'Settings')
 */
export function exposeLogger(rendererName: string): void {
  contextBridge.exposeInMainWorld('logger', {
    error: (message: string) => {
      void ipcRenderer.invoke('log:error', rendererName, message);
    },
    info: (message: string) => {
      void ipcRenderer.invoke('log:info', rendererName, message);
    },
    debug: (message: string) => {
      void ipcRenderer.invoke('log:debug', rendererName, message);
    },
  });
}
