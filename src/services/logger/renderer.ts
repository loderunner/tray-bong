import { contextBridge, ipcRenderer } from 'electron';

import type { Logger, LoggerBackend } from './logger';

/**
 * Exposes the logger backend to the renderer process via context bridge.
 * The backend accepts all log parameters including moduleName.
 */
export function exposeLogger(): void {
  const backend: LoggerBackend = {
    write: (level, world, moduleName, message) => {
      void ipcRenderer.invoke('log:write', level, world, moduleName, message);
    },
  };

  contextBridge.exposeInMainWorld('LoggerBackend', backend);
}

/**
 * Creates a logger instance for preload scripts (ContextBridge world).
 *
 * @param moduleName - The name of the module creating the logger
 * @returns A logger object with error, info, and debug methods
 */
export function useLogger(moduleName: string): Logger {
  return {
    error: (message: string) =>
      void ipcRenderer.invoke(
        'log:write',
        'ERROR',
        'ContextBridge',
        moduleName,
        message,
      ),
    info: (message: string) =>
      void ipcRenderer.invoke(
        'log:write',
        'INFO',
        'ContextBridge',
        moduleName,
        message,
      ),
    debug: (message: string) =>
      void ipcRenderer.invoke(
        'log:write',
        'DEBUG',
        'ContextBridge',
        moduleName,
        message,
      ),
  };
}
