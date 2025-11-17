import { ipcMain } from 'electron';

import { writeLog } from './main';

/**
 * Sets up IPC handlers for renderer process logging.
 * Must be called after the app is ready.
 */
export function setupLoggerIPC(): void {
  ipcMain.handle('log:error', (_event, rendererName: string, message: string) => {
    writeLog('ERROR', rendererName, message);
  });

  ipcMain.handle('log:info', (_event, rendererName: string, message: string) => {
    writeLog('INFO', rendererName, message);
  });

  ipcMain.handle('log:debug', (_event, rendererName: string, message: string) => {
    writeLog('DEBUG', rendererName, message);
  });
}



