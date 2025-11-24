import { ipcMain } from 'electron';

import { writeLog } from './main';

/**
 * Sets up IPC handlers for renderer process logging.
 * Must be called after the app is ready.
 */
export function setupLoggerIPC(): void {
  ipcMain.handle(
    'log:error',
    (_event, world: string, moduleName: string, message: string) => {
      writeLog('ERROR', world, moduleName, message);
    },
  );

  ipcMain.handle(
    'log:info',
    (_event, world: string, moduleName: string, message: string) => {
      writeLog('INFO', world, moduleName, message);
    },
  );

  ipcMain.handle(
    'log:debug',
    (_event, world: string, moduleName: string, message: string) => {
      writeLog('DEBUG', world, moduleName, message);
    },
  );
}
