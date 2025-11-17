import { app } from 'electron';
import started from 'electron-squirrel-startup';

import { createTray } from './tray';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

app.dock?.hide();
// app.applicationMenu = null;

app.on('ready', () => {
  void createTray();
});

app.on('window-all-closed', () => {});
