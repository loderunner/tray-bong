import { contextBridge, ipcRenderer } from 'electron';

import { type Logger, whatWorld } from './main';

export function createLogger(moduleName: string): Logger {
  const world = whatWorld();

  if (world !== 'ContextBridge') {
    throw new Error(
      'createLogger can only be called in the context bridge process',
    );
  }

  return {
    error: (message: string) => {
      void ipcRenderer.invoke(
        'log:error',
        'ContextBridge',
        moduleName,
        message,
      );
    },
    info: (message: string) => {
      void ipcRenderer.invoke('log:info', 'ContextBridge', moduleName, message);
    },
    debug: (message: string) => {
      void ipcRenderer.invoke(
        'log:debug',
        'ContextBridge',
        moduleName,
        message,
      );
    },
  };
}

/**
 * Exposes a logger to the renderer process via context bridge.
 *
 * @param moduleName - The name of the renderer process (e.g., 'Prompt', 'Settings')
 */
export function exposeLogger(moduleName: string): void {
  contextBridge.exposeInMainWorld('Logger', {
    error: (message: string) => {
      void ipcRenderer.invoke('log:error', 'Renderer', moduleName, message);
    },
    info: (message: string) => {
      void ipcRenderer.invoke('log:info', 'Renderer', moduleName, message);
    },
    debug: (message: string) => {
      void ipcRenderer.invoke('log:debug', 'Renderer', moduleName, message);
    },
  });
}
