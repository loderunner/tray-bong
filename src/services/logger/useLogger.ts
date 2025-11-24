import { getBackend } from './backend';
import { type Logger, whatWorld } from './main';

/**
 * Logger function for Main and ContextBridge worlds.
 * For React components in Renderer world, use the hook from LoggerProvider.tsx.
 *
 * @param moduleName - The name of the module creating the logger
 * @returns A logger object with error, info, and debug methods
 */
export function useLogger(moduleName: string): Logger {
  const world = whatWorld();

  if (world === 'Renderer') {
    throw new Error(
      'useLogger from useLogger.ts cannot be used in Renderer world. ' +
        'Use the React hook from LoggerProvider.tsx instead.',
    );
  }

  // Main or ContextBridge world - get backend directly
  const backend = getBackend();

  return {
    error: (message: string) => {
      backend.write('ERROR', world, moduleName, message);
    },
    info: (message: string) => {
      backend.write('INFO', world, moduleName, message);
    },
    debug: (message: string) => {
      backend.write('DEBUG', world, moduleName, message);
    },
  };
}
