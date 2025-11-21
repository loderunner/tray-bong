import fs from 'node:fs';

import { app } from 'electron';
import started from 'electron-squirrel-startup';

import { setupPromptWindowIPC } from './apps/prompt/main';
import { setupAIIPC } from './services/ai/ipc';
import { setupLoggerIPC } from './services/logger/ipc';
import * as logger from './services/logger/main';
import { setupPromptsIPC } from './services/prompts/ipc';
import { getPromptsFilePath, loadPrompts } from './services/prompts/main';
import { setupSettingsIPC } from './services/settings/ipc';
import { createTray, updateTrayMenu } from './tray';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

app.dock?.hide();
// app.applicationMenu = null;

app.on('ready', async () => {
  await logger.init();
  setupLoggerIPC();

  setupAIIPC();
  setupSettingsIPC();
  setupPromptsIPC();
  setupPromptWindowIPC();

  logger.info('Application started');

  createTray();

  // Load prompts and update tray menu
  const prompts = await loadPrompts();
  logger.debug(`Loaded ${prompts.length} prompts`);
  updateTrayMenu(prompts);

  // Watch prompts file for changes
  const filePath = getPromptsFilePath();
  fs.watch(filePath, async (eventType) => {
    if (eventType === 'change') {
      logger.info('Prompts file changed, reloading prompts');
      const updatedPrompts = await loadPrompts();
      logger.debug(`Reloaded ${updatedPrompts.length} prompts`);
      updateTrayMenu(updatedPrompts);
    }
  });
});

app.on('window-all-closed', () => {});
