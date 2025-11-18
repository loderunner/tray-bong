import { ipcRenderer } from 'electron';

/**
 * Creates logger functions for a specific renderer process.
 *
 * @param rendererName - The name of the renderer process (e.g., 'Prompt', 'Settings')
 * @returns Logger object with error, info, and debug methods
 */
export function createLogger(rendererName: string): {
  error: (message: string) => void;
  info: (message: string) => void;
  debug: (message: string) => void;
} {
  return {
    error: (message: string) => {
      void ipcRenderer.invoke('log:error', rendererName, message);
    },
    info: (message: string) => {
      void ipcRenderer.invoke('log:info', rendererName, message);
    },
    debug: (message: string) => {
      void ipcRenderer.invoke('log:debug', rendererName, message);
    },
  };
}
