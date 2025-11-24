import { whatWorld, writeLog } from './main';

export type LogLevel = 'ERROR' | 'INFO' | 'DEBUG';

export type LoggerBackend = {
  write: (
    level: LogLevel,
    world: string,
    moduleName: string,
    message: string,
  ) => void;
};

let mainBackend: LoggerBackend | null = null;
let contextBridgeBackend: LoggerBackend | null = null;

/**
 * Gets the logger backend instance for the current world.
 * Lazily creates and caches the backend on first call.
 *
 * @returns The logger backend instance
 */
export function getBackend(): LoggerBackend {
  const world = whatWorld();

  if (world === 'Main') {
    mainBackend ??= {
      write: (level, world, moduleName, message) => {
        writeLog(level, world, moduleName, message);
      },
    };
    return mainBackend;
  }

  if (world === 'ContextBridge') {
    contextBridgeBackend ??= {
      write: (level, world, moduleName, message) => {
        void import('electron').then(({ ipcRenderer }) => {
          void ipcRenderer.invoke(
            'log:write',
            level,
            world,
            moduleName,
            message,
          );
        });
      },
    };
    return contextBridgeBackend;
  }

  if (typeof LoggerBackend === 'undefined') {
    throw new Error(
      'LoggerBackend not exposed. Make sure exposeLogger() is called in preload script.',
    );
  }

  return LoggerBackend;
}
