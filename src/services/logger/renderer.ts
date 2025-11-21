import { contextBridge, ipcRenderer } from 'electron';

import { whatWorld } from '../what-world';

/**
 * Logger instance with context-specific logging methods.
 */
export type Logger = {
  /**
   * Logs an error message.
   *
   * @param message - The error message to log
   */
  error: (message: string) => void;
  /**
   * Logs an info message.
   *
   * @param message - The info message to log
   */
  info: (message: string) => void;
  /**
   * Logs a debug message.
   *
   * @param message - The debug message to log
   */
  debug: (message: string) => void;
};

/**
 * Creates a logger instance with the specified context.
 * Captures the world context at creation time.
 *
 * @param context - The context identifier for this logger (e.g., 'Prompt', 'Settings', 'AI')
 * @returns A logger instance with error, info, and debug methods
 */
export function createLogger(context: string): Logger {
  const world = whatWorld();
  return {
    error: (message: string) => {
      void ipcRenderer.invoke('log:error', world, context, message);
    },
    info: (message: string) => {
      void ipcRenderer.invoke('log:info', world, context, message);
    },
    debug: (message: string) => {
      void ipcRenderer.invoke('log:debug', world, context, message);
    },
  };
}

/**
 * Exposes logger factory to the renderer process via context bridge.
 * Modules should use this to create their own logger instances.
 */
export function exposeLoggerFactory(): void {
  contextBridge.exposeInMainWorld('createLogger', (context: string): Logger => {
    return createLogger(context);
  });
}
