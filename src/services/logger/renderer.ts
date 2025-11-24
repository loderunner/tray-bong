import { contextBridge, ipcRenderer } from 'electron';

import type { LoggerBackend } from './backend';

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
