import { type ReactNode, createContext, useContext } from 'react';

import type { Logger, LoggerBackend } from './logger';

export const LoggerContext = createContext<LoggerBackend | null>(null);

/**
 * Provides the logger backend to React components.
 * The backend uses globalThis.LoggerBackend set by exposeLogger() in preload.
 */
export default function LoggerProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return <LoggerContext value={LoggerBackend}>{children}</LoggerContext>;
}

/**
 * React hook for getting a logger instance in Renderer world.
 * Must be used within a LoggerProvider.
 *
 * @param moduleName - The name of the module creating the logger
 * @returns A logger object with error, info, and debug methods
 */
export function useLogger(moduleName: string): Logger {
  const backend = useContext(LoggerContext);
  if (backend === null) {
    throw new Error(
      'Logger not found. Make sure LoggerProvider is wrapping your component tree.',
    );
  }

  return {
    error: (message: string) => {
      backend.write('ERROR', 'Renderer', moduleName, message);
    },
    info: (message: string) => {
      backend.write('INFO', 'Renderer', moduleName, message);
    },
    debug: (message: string) => {
      backend.write('DEBUG', 'Renderer', moduleName, message);
    },
  };
}
