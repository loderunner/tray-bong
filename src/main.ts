import { app } from 'electron';
import started from 'electron-squirrel-startup';

import { setupLoggerIPC } from './logger/ipc';
import * as logger from './logger/main';
import { createTray } from './tray';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

app.dock?.hide();
// app.applicationMenu = null;

app.on('ready', () => {
  void (async () => {
    await logger.init();
    setupLoggerIPC();

    logger.info('Application started');

    await createTray();
  })();
});

app.on('window-all-closed', () => {});
