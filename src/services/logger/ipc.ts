import { ipcMain } from 'electron';

import type { LogLevel } from './logger';
import { writeLog } from './main';

/**
 * Sets up IPC handlers for renderer process logging.
 * Must be called after the app is ready.
 */
export function setupLoggerIPC(): void {
  ipcMain.handle(
    'log:write',
    (
      _event,
      level: LogLevel,
      world: string,
      moduleName: string,
      message: string,
    ) => {
      writeLog(level, world, moduleName, message);
    },
  );
}
